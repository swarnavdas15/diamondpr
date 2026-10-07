const XLSX = require('xlsx');

const data = [
  {
    ClientCode: 'BULK-001',
    CompanyName: 'Tech Innovators Inc',
    ContactNo: '+91 9876543210',
    ContactName: 'Rahul Sharma',
    Email: 'rahul@techinnovators.com',
    Address: '123 Tech Park, Bangalore',
    GSTNumber: '29ABCDE1234F1Z5',
    Industry: 'IT / Software',
    Remarks: 'Priority client, needs weekly follow-ups'
  },
  {
    ClientCode: 'BULK-002',
    CompanyName: 'Global Logistics Solutions',
    ContactNo: '+44 7911123456',
    ContactName: 'Sarah Jenkins',
    Email: 's.jenkins@globallogistics.co.uk',
    Address: '45 Freight Way, London',
    GSTNumber: '',
    Industry: 'Logistics',
    Remarks: 'Looking for annual contract'
  },
  {
    ClientCode: 'BULK-003',
    CompanyName: 'Green Energy Corp',
    ContactNo: '+1 5550198765',
    ContactName: 'Michael Green',
    Email: 'mgreen@greenenergy.com',
    Address: '789 Eco Ave, California',
    GSTNumber: '12XYZDE5678G2Z1',
    Industry: 'Renewable Energy',
    Remarks: 'Interested in bulk orders'
  },
  {
    ClientCode: 'BULK-004',
    CompanyName: 'Apex Manufacturing',
    ContactNo: '+91 8765432109',
    ContactName: 'Anita Desai',
    Email: 'anita@apexmanufacturing.in',
    Address: 'Plot 42, Industrial Area, Pune',
    GSTNumber: '27PQRST4321M1Z2',
    Industry: 'Manufacturing',
    Remarks: 'Requires custom quotations'
  }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

XLSX.writeFile(workbook, '../Sample_Clients.xlsx');
console.log('Sample_Clients.xlsx created successfully in the project root!');
