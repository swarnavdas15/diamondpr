import jwt from 'jsonwebtoken';
const token = jwt.sign({ userId: 'test', role: 'SUPER_ADMIN' }, 'supersecretkey_diamond_flange_erp', { expiresIn: '1h' });
const res = await fetch('http://localhost:5000/api/users', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await res.json();
console.log(data);
