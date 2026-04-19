import Database from 'better-sqlite3';
const db = new Database('petroleum_supply_chain.db');

console.log("Crude_Purchase:", db.prepare('SELECT * FROM Crude_Purchase').all());
console.log("Transportation_Log:", db.prepare('SELECT * FROM Transportation_Log').all());
console.log("Storage_Batch:", db.prepare('SELECT * FROM Storage_Batch').all());
console.log("Refining_Process:", db.prepare('SELECT * FROM Refining_Process').all());

const joinSql = `
      SELECT 
        c.Purchase_ID as id,
        t.Transit_ID as t_id,
        s.Batch_ID as s_id,
        rp.Refine_ID as rp_id,
        CASE 
          WHEN rp.Refine_ID IS NOT NULL THEN 3
          WHEN s.Batch_ID IS NOT NULL THEN 2
          WHEN t.Transit_ID IS NOT NULL THEN 1
          ELSE 0
        END as stage
      FROM Crude_Purchase c
      LEFT JOIN Transportation_Log t ON t.Purchase_ID = c.Purchase_ID
      LEFT JOIN Storage_Batch s ON s.Transit_ID = t.Transit_ID
      LEFT JOIN Refining_Process rp ON rp.Batch_ID = s.Batch_ID
`;
console.log("JOIN result:", db.prepare(joinSql).all());
