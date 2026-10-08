const { Client } = require('pg');
require('dotenv').config({ path: 'Backend/.env' });

const alterDb = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log('Adding clientDataVisibility to User...');
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clientDataVisibility" text DEFAULT 'FULL';`);
    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
};

alterDb();
