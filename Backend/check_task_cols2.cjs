const { Client } = require('pg');
require('dotenv').config({ path: 'Backend/.env' });
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query("SELECT column_name FROM information_schema.columns WHERE table_name='Task'"))
  .then(res => console.log(res.rows))
  .catch(console.error).finally(() => c.end());
