import jwt from 'jsonwebtoken';
const token = jwt.sign({ userId: '01a0ec9a-026f-7189-b7f4-83d81e3aae90', role: 'SUPER_ADMIN' }, 'supersecretkey_diamond_flange_erp', { expiresIn: '1h' });
const res = await fetch('http://localhost:5000/api/orders/client', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    clientCode: "CL-9999",
    companyName: "Acme Corp",
    contactName: "John Doe",
    contactNo: "555-1234",
    email: "john@acme.com",
    gstNumber: "GST1234567890",
    industry: "Manufacturing",
    remarks: "Good client"
  })
});
const data = await res.json();
console.log(data);
