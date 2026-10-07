import { db } from './prisma/db';

async function createTable() {
  try {
    await db.query(`
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
    process.exit();
  }
}
createTable();
