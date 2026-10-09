import 'dotenv/config';
import { Pool } from 'pg';

async function createTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "PurchaseBatch" (
        "id" CHAR(36) PRIMARY KEY,
        "orderId" CHAR(36) NOT NULL,
        "vendorName" TEXT NOT NULL,
        "quantityReceived" INTEGER NOT NULL DEFAULT 0,
        "cost" DOUBLE PRECISION,
        "remarks" TEXT,
        "createdById" CHAR(36),
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PurchaseBatch table created!');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await pool.end();
    process.exit();
  }
}
createTable();
