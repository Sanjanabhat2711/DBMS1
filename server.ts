import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import db from './db.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';

app.use(cors());
app.use(express.json());

// --- Helper Functions ---

const generateHash = (data: any) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const getLatestLedgerHash = (): string | null => {
  const row: any = db.prepare('SELECT Transaction_Data_Hash FROM Transaction_Ledger ORDER BY Transaction_ID DESC LIMIT 1').get();
  return row ? row.Transaction_Data_Hash : '0'.repeat(64);
};

const addToLedger = (tableName: string, recordId: string, newData: any, signature: string, operation: string = 'INSERT', oldData: any = null) => {
  const previousHash = getLatestLedgerHash();
  
  const ledgerEntry = {
    tableName,
    recordId,
    operation,
    oldData: oldData ? JSON.stringify(oldData) : null,
    newData: JSON.stringify(newData),
    previousHash,
    timestamp: new Date().toISOString()
  };

  const currentHash = generateHash(ledgerEntry);

  db.prepare(`
    INSERT INTO Transaction_Ledger 
    (TableName, Record_ID, Operation, Old_Data, New_Data, Transaction_Data_Hash, Previous_Transaction_Hash, Digital_Signature_Sender)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(tableName, recordId, operation, ledgerEntry.oldData, ledgerEntry.newData, currentHash, previousHash, signature);
};

// --- Auth Middleware ---

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Auth Routes ---

app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    db.prepare('INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hashedPassword, role || 'USER');
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user: any = db.prepare('SELECT * FROM Users WHERE username = ?').get(username);
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- CRUD Routes ---

// Generic CRUD helper generator
const createCRUDRoutes = (tableName: string, idField: string) => {
  const roleMapping: Record<string, string> = {
    'Crude_Purchase': 'CRUDE_MANAGER',
    'Transportation_Log': 'TRANSPORT_MANAGER',
    'Storage_Batch': 'STORAGE_MANAGER',
    'Refining_Process': 'REFINING_MANAGER',
    'Distribution': 'DISTRIBUTION_MANAGER',
    'Retail': 'RETAIL_MANAGER'
  };

  const checkRole = (req: any, res: any, next: any) => {
    const userRole = req.user.role;
    const requiredRole = roleMapping[tableName];
    if (userRole === 'ADMIN' || userRole === requiredRole) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. You do not have permission to edit this section.' });
    }
  };

  // GET all
  app.get(`/api/${tableName.toLowerCase()}`, authenticateToken, (req, res) => {
    try {
      const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST new
  app.post(`/api/${tableName.toLowerCase()}`, authenticateToken, checkRole, async (req, res) => {
    const { signature, ...data } = req.body;
    
    // Throughput Efficiency Calculation
    if (tableName === 'Refining_Process' && data.Input_Volume && data.Output_Volume) {
      data.Throughput_Efficiency = (data.Output_Volume / data.Input_Volume) * 100;
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(',');

    try {
      db.prepare(
        `INSERT INTO ${tableName} (${fields.join(',')}) VALUES (${placeholders})`
      ).run(...values);
      
      addToLedger(tableName, data[idField], data, signature || 'SYSTEM_GEN');
      res.status(201).json({ message: 'Record created and ledger updated', id: data[idField] });
    } catch (err: any) {
      console.error(`Error adding to ${tableName}:`, err);
      let errorMessage = err.message;
      if (err.message.includes('FOREIGN KEY constraint failed')) {
        errorMessage = 'Reference ID not found in the related table. Please verify your IDs.';
      } else if (err.message.includes('UNIQUE constraint failed')) {
        errorMessage = 'A record with this ID already exists.';
      }
      res.status(400).json({ error: errorMessage });
    }
  });

  // PUT update (Correction with Snapshot)
  app.put(`/api/${tableName.toLowerCase()}/:id`, authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { signature, ...data } = req.body;
    
    try {
      const oldData = db.prepare(`SELECT * FROM ${tableName} WHERE ${idField} = ?`).get(id);
      if (!oldData) return res.status(404).json({ error: 'Record not found' });

      const fields = Object.keys(data);
      const values = [...Object.values(data), id];
      const setClause = fields.map(f => `${f} = ?`).join(',');

      db.prepare(`UPDATE ${tableName} SET ${setClause} WHERE ${idField} = ?`).run(...values);
      
      addToLedger(tableName, id, data, signature || 'SYSTEM_CORRECTION', 'UPDATE', oldData);
      res.json({ message: 'Record updated and correction logged' });
    } catch (err: any) {
      console.error(`Error updating ${tableName}:`, err);
      let errorMessage = err.message;
      if (err.message.includes('FOREIGN KEY constraint failed')) {
        errorMessage = 'Reference ID not found in the related table. Please verify your IDs.';
      }
      res.status(400).json({ error: errorMessage });
    }
  });
};

// Initialize routes for all tables
createCRUDRoutes('Crude_Purchase', 'Purchase_ID');
createCRUDRoutes('Transportation_Log', 'Transit_ID');
createCRUDRoutes('Storage_Batch', 'Batch_ID');
createCRUDRoutes('Refining_Process', 'Refine_ID');
createCRUDRoutes('Distribution', 'Distribution_ID');
createCRUDRoutes('Retail', 'Retail_ID');

// Ledger Route
app.get('/api/ledger', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM Transaction_Ledger ORDER BY Transaction_ID DESC').all();
    res.json(rows);
  } catch (err: any) {
    console.error('Ledger error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Provenance Tracking
app.get('/api/provenance/:type/:id', authenticateToken, (req, res) => {
  const { type, id } = req.params;
  let provenance: any = {};

  try {
    if (type === 'retail') {
      const retail = db.prepare('SELECT * FROM Retail WHERE Retail_ID = ?').get(id) as any;
      if (retail) {
        provenance.retail = retail;
        const dist = db.prepare('SELECT * FROM Distribution WHERE Distribution_ID = ?').get(retail.Distribution_ID) as any;
        if (dist) {
          provenance.distribution = dist;
          const refine = db.prepare('SELECT * FROM Refining_Process WHERE Refine_ID = ?').get(dist.Refine_ID) as any;
          if (refine) {
            provenance.refining = refine;
            const batch = db.prepare('SELECT * FROM Storage_Batch WHERE Batch_ID = ?').get(refine.Batch_ID) as any;
            if (batch) {
              provenance.storage = batch;
              const transit = db.prepare('SELECT * FROM Transportation_Log WHERE Transit_ID = ?').get(batch.Transit_ID) as any;
              if (transit) {
                provenance.transport = transit;
                const crude = db.prepare('SELECT * FROM Crude_Purchase WHERE Purchase_ID = ?').get(transit.Purchase_ID) as any;
                provenance.crude = crude;
              }
            }
          }
        }
      }
    }
    res.json(provenance);
  } catch (err: any) {
    console.error('Provenance error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reorder Alerts
app.get('/api/alerts', authenticateToken, (req, res) => {
  try {
    // Reorder fields removed per user request
    res.json({ stockAlerts: [], storageAlerts: [] });
  } catch (err: any) {
    console.error('Alerts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ledger Reconstruction (Historical State)
app.get('/api/ledger/reconstruct/:tableName/:recordId', authenticateToken, (req, res) => {
  const { tableName, recordId } = req.params;
  try {
    const history = db.prepare('SELECT * FROM Transaction_Ledger WHERE TableName = ? AND Record_ID = ? ORDER BY Timestamp ASC').all(tableName, recordId);
    res.json(history);
  } catch (err: any) {
    console.error('Ledger reconstruction error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Stats
app.get('/api/stats', authenticateToken, (req, res) => {
  const tables = ['Crude_Purchase', 'Transportation_Log', 'Storage_Batch', 'Refining_Process', 'Distribution', 'Retail'];
  const stats: any = { counts: {}, growth: {}, inventory: [] };

  try {
    tables.forEach(table => {
      // Get current count
      const row: any = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      stats.counts[table] = row ? row.count : 0;

      // Calculate growth (compare last 7 days vs previous 7 days)
      // Since we don't have a standardized 'created_at' in all tables, we'll use the ID count as a proxy for growth if no date field exists
      // or just return a random-ish but stable number based on the count for now if date parsing is complex.
      // Better: let's try to find a date field.
      let dateField = '';
      if (table === 'Crude_Purchase') dateField = 'Purchased_Date';
      if (table === 'Transportation_Log') dateField = 'Departure_Time';
      if (table === 'Storage_Batch') dateField = 'Last_Inspection_Date';
      if (table === 'Refining_Process') dateField = 'Refining_Date';
      // Distribution and Retail don't have explicit dates in the schema I saw earlier, let's check.
      
      if (dateField) {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

        const recent: any = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${dateField} >= ?`).get(sevenDaysAgo);
        const previous: any = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${dateField} >= ? AND ${dateField} < ?`).get(fourteenDaysAgo, sevenDaysAgo);
        
        const recentCount = recent ? recent.count : 0;
        const previousCount = previous ? previous.count : 0;

        if (previousCount === 0) {
          stats.growth[table] = recentCount > 0 ? 100 : 0;
        } else {
          stats.growth[table] = Math.round(((recentCount - previousCount) / previousCount) * 100);
        }
      } else {
        stats.growth[table] = 0;
      }
    });

    // Calculate Inventory Status
    const crudeVol: any = db.prepare('SELECT SUM(Volume) as total FROM Crude_Purchase').get();
    const refineVol: any = db.prepare('SELECT SUM(Input_Volume) as total FROM Refining_Process').get();
    const distVol: any = db.prepare('SELECT SUM(Dispatch_Volume) as total FROM Distribution').get();
    const retailVol: any = db.prepare('SELECT SUM(Receive_Volume) as total FROM Retail').get();

    stats.inventory = [
      { label: 'Main Reservoir', value: Math.min(100, Math.round(((crudeVol?.total || 0) / 100000) * 100)), color: 'bg-blue-500' },
      { label: 'Refinery Input', value: Math.min(100, Math.round(((refineVol?.total || 0) / 100000) * 100)), color: 'bg-teal-500' },
      { label: 'Distribution Hub', value: Math.min(100, Math.round(((distVol?.total || 0) / 100000) * 100)), color: 'bg-emerald-500' },
      { label: 'Retail Reserve', value: Math.min(100, Math.round(((retailVol?.total || 0) / 100000) * 100)), color: 'bg-amber-500' },
    ];

    res.json(stats);
  } catch (err: any) {
    console.error('Stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
