import 'dotenv/config';
import { Pool } from 'pg';

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT count(*) FROM vendors');
    console.log('Vendors exists:', res.rows);
  } catch (err) {
    console.error('No vendors table', err.message);
    try {
      console.log('Pushing schema changes...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS vendors (
          "id" text PRIMARY KEY,
          "vendorCode" text NOT NULL,
          "vendorName" text NOT NULL,
          "companyName" text,
          "gstNumber" text,
          "panNumber" text,
          "contactPerson" text NOT NULL,
          "mobileNumber" text NOT NULL,
          "alternateMobile" text,
          "email" text NOT NULL,
          "website" text,
          "addressLine1" text,
          "addressLine2" text,
          "city" text,
          "state" text,
          "pinCode" text,
          "country" text,
          "materialSupplied" text NOT NULL,
          "vendorCategory" text,
          "paymentTerms" text,
          "leadTime" text,
          "status" text DEFAULT 'ACTIVE',
          "remarks" text,
          "notes" text,
          "createdAt" timestamptz DEFAULT now() NOT NULL,
          "updatedAt" timestamptz,
          "isDeleted" integer DEFAULT 0 NOT NULL
        )
      `);
      console.log('Table vendors created successfully!');
    } catch(e) { console.error('Push failed', e); }
  } finally {
    await pool.end();
  }
}
test().then(() => process.exit(0));
