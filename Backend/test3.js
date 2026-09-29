import jwt from 'jsonwebtoken';
const token = jwt.sign({ userId: 'test', role: 'SUPER_ADMIN' }, 'supersecretkey_diamond_flange_erp', { expiresIn: '1h' });
const res = await fetch('http://localhost:5000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    name: "Test User 4",
    username: "testuser4",
    email: "test4@test.com",
    password: "Password123",
    mobileNumber: "1234567890",
    employeeId: "EMP-001",
    role: "PRODUCTION"
  })
});
const data = await res.json();
console.log(data);
