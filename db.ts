// db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Siddhi@06',
  database: 'petroleum_supply_chain',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to log and execute queries
export const query = async (sql: string, params?: any[]) => {
  console.log('Executing Query:', sql); // This shows the query in your Node terminal
  if (params) console.log('With Params:', params);
  
  const [results] = await pool.execute(sql, params);
  return results;
};

export default pool;