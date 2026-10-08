const { Client } = require('pg');
require('dotenv').config({ path: 'Backend/.env' });
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('SELECT * FROM "PurchaseBatch" LIMIT 1')).then(res => console.log('Rows:', res.rows)).catch(console.error).finally(() => c.end());
