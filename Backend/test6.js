import jwt from 'jsonwebtoken';
const token = jwt.sign({ userId: '01a0ec9a-026f-7189-b7f4-83d81e3aae90', role: 'SUPER_ADMIN' }, 'supersecretkey_diamond_flange_erp', { expiresIn: '1h' });

async function test() {
  console.log("Testing GET /api/clients");
  const res1 = await fetch('http://localhost:5000/api/clients', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Clients status:", res1.status);
  console.log(await res1.text());

  console.log("Testing GET /api/orders");
  const res2 = await fetch('http://localhost:5000/api/orders', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Orders status:", res2.status);
  console.log(await res2.text());
}

test();
