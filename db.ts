import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'petroleum_supply_chain.db');

const db = new Database(dbPath, { verbose: console.log });
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  // Users Table
  db.prepare(`CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER'
  )`).run();

  // Table 1: Crude_Purchase
  db.prepare(`CREATE TABLE IF NOT EXISTS Crude_Purchase (
    Purchase_ID TEXT PRIMARY KEY,
    Volume INTEGER NOT NULL,
    Price INTEGER NOT NULL,
    Grade TEXT NOT NULL,
    Purchased_Date TEXT NOT NULL
  )`).run();

  // Table 2: Transportation_Log
  db.prepare(`CREATE TABLE IF NOT EXISTS Transportation_Log (
    Transit_ID TEXT PRIMARY KEY,
    Vehicle_ID TEXT NOT NULL,
    Driver_ID TEXT,
    Quantity INTEGER,
    Route_Type TEXT NOT NULL, -- Ship, Rail, Road
    Departure_Time TEXT NOT NULL,
    Arrival_Time TEXT,
    Fuel_Quality TEXT NOT NULL,
    Purchase_ID TEXT,
    FOREIGN KEY (Purchase_ID) REFERENCES Crude_Purchase(Purchase_ID)
  )`).run();

  // Table 3: Storage_Batch
  db.prepare(`CREATE TABLE IF NOT EXISTS Storage_Batch (
    Batch_ID TEXT PRIMARY KEY,
    Tank_Number INTEGER NOT NULL,
    Current_Capacity INTEGER NOT NULL,
    Last_Inspection_Date TEXT,
    Transit_ID TEXT,
    FOREIGN KEY (Transit_ID) REFERENCES Transportation_Log(Transit_ID)
  )`).run();

  // Table 4: Refining_Process
  db.prepare(`CREATE TABLE IF NOT EXISTS Refining_Process (
    Refine_ID TEXT PRIMARY KEY,
    Input_Volume INTEGER NOT NULL,
    Output_Volume INTEGER NOT NULL,
    Refining_Date TEXT NOT NULL,
    Additive_Chemical_Fingerprint TEXT,
    Throughput_Efficiency REAL,
    Batch_ID TEXT,
    FOREIGN KEY (Batch_ID) REFERENCES Storage_Batch(Batch_ID)
  )`).run();

  // Table 5: Distribution
  db.prepare(`CREATE TABLE IF NOT EXISTS Distribution (
    Distribution_ID TEXT PRIMARY KEY,
    Dispatch_Volume INTEGER NOT NULL,
    Delivery_Status TEXT NOT NULL,
    Adulteration_Test_Result TEXT,
    Final_Consumer_Hash TEXT,
    Refine_ID TEXT,
    FOREIGN KEY (Refine_ID) REFERENCES Refining_Process(Refine_ID)
  )`).run();

  // Table 6: Retail
  db.prepare(`CREATE TABLE IF NOT EXISTS Retail (
    Retail_ID TEXT PRIMARY KEY,
    Station_ID TEXT NOT NULL,
    Receive_Volume INTEGER NOT NULL,
    Storage_Tank_Condition INTEGER,
    Distribution_ID TEXT,
    FOREIGN KEY (Distribution_ID) REFERENCES Distribution(Distribution_ID)
  )`).run();

  // Ledger Table
  db.prepare(`CREATE TABLE IF NOT EXISTS Transaction_Ledger (
    Transaction_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    TableName TEXT NOT NULL,
    Record_ID TEXT NOT NULL,
    Operation TEXT NOT NULL DEFAULT 'INSERT', -- INSERT, UPDATE
    Old_Data TEXT, -- JSON snapshot before change
    New_Data TEXT NOT NULL, -- JSON snapshot after change
    Transaction_Data_Hash TEXT NOT NULL,
    Previous_Transaction_Hash TEXT,
    Digital_Signature_Sender TEXT NOT NULL,
    Digital_Signature_Receiver TEXT,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

function runMigrations() {
  const ensureColumn = (table: string, column: string, type: string) => {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    if (!info.some(col => col.name === column)) {
      try {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
        console.log(`Added column ${column} to ${table}`);
      } catch (err) {
        console.error(`Failed to add column ${column} to ${table}:`, err);
      }
    }
  };

  // Ensure columns for Distribution
  ensureColumn('Distribution', 'Adulteration_Test_Result', 'TEXT');
  ensureColumn('Distribution', 'Final_Consumer_Hash', 'TEXT');

  // Ensure columns for Retail
  ensureColumn('Retail', 'Tank_Capacity', 'INTEGER DEFAULT 50000');

  // Ensure columns for Storage_Batch
  ensureColumn('Storage_Batch', 'Max_Capacity', 'INTEGER DEFAULT 100000');

  // Ensure columns for Transportation_Log
  ensureColumn('Transportation_Log', 'Driver_ID', 'TEXT');
  ensureColumn('Transportation_Log', 'Quantity', 'INTEGER');

  // Recreate Transportation_Log if it has obsolete columns that cause NOT NULL errors
  const transInfo = db.prepare(`PRAGMA table_info(Transportation_Log)`).all() as any[];
  const obsoleteColumns = ['Loaded_Volume', 'Unloaded_Volume', 'Actual_Route', 'Planned_Route', 'Carbon_Emission', 'Density'];
  if (transInfo.some(col => obsoleteColumns.includes(col.name))) {
    console.log('Recreating Transportation_Log to remove obsolete columns...');
    try {
      db.transaction(() => {
        db.prepare(`ALTER TABLE Transportation_Log RENAME TO Transportation_Log_Old`).run();
        db.prepare(`CREATE TABLE Transportation_Log (
          Transit_ID TEXT PRIMARY KEY,
          Vehicle_ID TEXT NOT NULL,
          Driver_ID TEXT,
          Quantity INTEGER,
          Route_Type TEXT NOT NULL,
          Departure_Time TEXT NOT NULL,
          Arrival_Time TEXT,
          Fuel_Quality TEXT NOT NULL,
          Purchase_ID TEXT,
          FOREIGN KEY (Purchase_ID) REFERENCES Crude_Purchase(Purchase_ID)
        )`).run();
        // Try to copy data back, ignoring missing columns
        const commonColumns = transInfo
          .filter(col => !obsoleteColumns.includes(col.name))
          .map(col => col.name)
          .join(',');
        db.prepare(`INSERT INTO Transportation_Log (${commonColumns}) SELECT ${commonColumns} FROM Transportation_Log_Old`).run();
        db.prepare(`DROP TABLE Transportation_Log_Old`).run();
      })();
    } catch (err) {
      console.error('Failed to recreate Transportation_Log:', err);
    }
  }

  // Recreate Storage_Batch if it has obsolete columns
  const storageInfo = db.prepare(`PRAGMA table_info(Storage_Batch)`).all() as any[];
  const storageObsolete = ['Reorder_Level', 'Max_Capacity'];
  if (storageInfo.some(col => storageObsolete.includes(col.name))) {
    console.log('Recreating Storage_Batch to remove obsolete columns...');
    try {
      db.transaction(() => {
        db.prepare(`ALTER TABLE Storage_Batch RENAME TO Storage_Batch_Old`).run();
        db.prepare(`CREATE TABLE Storage_Batch (
          Batch_ID TEXT PRIMARY KEY,
          Tank_Number INTEGER NOT NULL,
          Current_Capacity INTEGER NOT NULL,
          Last_Inspection_Date TEXT,
          Transit_ID TEXT,
          FOREIGN KEY (Transit_ID) REFERENCES Transportation_Log(Transit_ID)
        )`).run();
        const commonColumns = storageInfo
          .filter(col => !storageObsolete.includes(col.name))
          .map(col => col.name)
          .join(',');
        db.prepare(`INSERT INTO Storage_Batch (${commonColumns}) SELECT ${commonColumns} FROM Storage_Batch_Old`).run();
        db.prepare(`DROP TABLE Storage_Batch_Old`).run();
      })();
    } catch (err) {
      console.error('Failed to recreate Storage_Batch:', err);
    }
  }

  // Recreate Refining_Process if it has obsolete columns
  const refiningInfo = db.prepare(`PRAGMA table_info(Refining_Process)`).all() as any[];
  if (refiningInfo.some(col => col.name === 'CO2_Emission')) {
    console.log('Recreating Refining_Process to remove obsolete columns...');
    try {
      db.transaction(() => {
        db.prepare(`ALTER TABLE Refining_Process RENAME TO Refining_Process_Old`).run();
        db.prepare(`CREATE TABLE Refining_Process (
          Refine_ID TEXT PRIMARY KEY,
          Input_Volume INTEGER NOT NULL,
          Output_Volume INTEGER NOT NULL,
          Refining_Date TEXT NOT NULL,
          Additive_Chemical_Fingerprint TEXT,
          Throughput_Efficiency REAL,
          Batch_ID TEXT,
          FOREIGN KEY (Batch_ID) REFERENCES Storage_Batch(Batch_ID)
        )`).run();
        const commonColumns = refiningInfo
          .filter(col => col.name !== 'CO2_Emission')
          .map(col => col.name)
          .join(',');
        db.prepare(`INSERT INTO Refining_Process (${commonColumns}) SELECT ${commonColumns} FROM Refining_Process_Old`).run();
        db.prepare(`DROP TABLE Refining_Process_Old`).run();
      })();
    } catch (err) {
      console.error('Failed to recreate Refining_Process:', err);
    }
  }

  // Recreate Retail if it has obsolete columns
  const retailInfo = db.prepare(`PRAGMA table_info(Retail)`).all() as any[];
  const retailObsolete = ['Threshold', 'Evap_Loss', 'Current_Stock', 'Tank_Capacity'];
  if (retailInfo.some(col => retailObsolete.includes(col.name))) {
    console.log('Recreating Retail to remove obsolete columns...');
    try {
      db.transaction(() => {
        db.prepare(`ALTER TABLE Retail RENAME TO Retail_Old`).run();
        db.prepare(`CREATE TABLE Retail (
          Retail_ID TEXT PRIMARY KEY,
          Station_ID TEXT NOT NULL,
          Receive_Volume INTEGER NOT NULL,
          Storage_Tank_Condition INTEGER,
          Distribution_ID TEXT,
          FOREIGN KEY (Distribution_ID) REFERENCES Distribution(Distribution_ID)
        )`).run();
        const commonColumns = retailInfo
          .filter(col => !retailObsolete.includes(col.name))
          .map(col => col.name)
          .join(',');
        db.prepare(`INSERT INTO Retail (${commonColumns}) SELECT ${commonColumns} FROM Retail_Old`).run();
        db.prepare(`DROP TABLE Retail_Old`).run();
      })();
    } catch (err) {
      console.error('Failed to recreate Retail:', err);
    }
  }

  // Migration: Add role to Users if missing
  const userInfo = db.prepare(`PRAGMA table_info(Users)`).all() as any[];
  if (!userInfo.some(col => col.name === 'role')) {
    console.log('Adding role column to Users table...');
    try {
      db.prepare(`ALTER TABLE Users ADD COLUMN role TEXT NOT NULL DEFAULT 'ADMIN'`).run();
    } catch (err) {
      console.error('Failed to add role column:', err);
    }
  }
}

initializeDatabase();
runMigrations();

export default db;
