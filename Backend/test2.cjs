const axios = require('axios');
const jwt = require('jsonwebtoken');
async function run() {
  try {
    const token = jwt.sign({ userId: 'test', role: 'SUPER_ADMIN' }, 'supersecretkey', { expiresIn: '1h' });
    const res = await axios.post('http://localhost:5000/api/users', {
      name: "Test User 3",
      username: "testuser999",
      email: "test999@test.com",
      password: "Password123",
      mobileNumber: "1234567890",
      employeeId: "EMP-001",
      role: "PRODUCTION"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Response:", res.data);
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
run();
