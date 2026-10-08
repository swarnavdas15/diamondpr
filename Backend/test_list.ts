import 'dotenv/config';
import { db } from './src/prisma/db';
async function test() {
  try {
    const v = await db.orm.public.Vendor.all();
    console.log('Vendors:', v.length);
  } catch(e) {
    console.error('Error:', e);
  }
}
test().then(() => process.exit(0));
