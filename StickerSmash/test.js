const axios = require('axios');
async function run() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'superadmin',
      password: 'SuperAdmin@123'
    });
    const token = loginRes.data.token;
    console.log("Logged in");

    const res = await axios.post('http://localhost:5000/api/users', {
      name: "Test User 2",
      username: "testuser99",
      email: "test99@test.com",
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
