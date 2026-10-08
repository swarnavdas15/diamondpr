const { Client } = require('pg');
require('dotenv').config({ path: 'Backend/.env' });

async function createTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    await client.query(`
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
    console.log('PurchaseBatch table created via pg!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
createTable();
