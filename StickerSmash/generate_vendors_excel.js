const XLSX = require('xlsx');

const data = [
  {
    'Vendor Code': 'VND-3001',
    'Vendor Name': 'Jindal Forgings & Steel Ltd',
    'Company Name': 'Jindal Steels Pvt Ltd',
    'GST Number': '27AAACA1234F1Z5',
    'PAN Number': 'AAACA1234F',
    'Contact Person': 'Vikram Sharma',
    'Mobile Number': '9876543210',
    'Email': 'vikram@jindalforgings.com',
    'Material Supplied': 'SS Raw Billets & Forgings',
    'Vendor Category': 'Raw Material',
    'Address Line 1': 'Plot 45, Industrial Area',
    'City': 'Hisar',
    'State': 'Haryana',
    'PIN Code': '125005',
    'Country': 'India',
    'Payment Terms': 'Net 30',
    'Lead Time': '7 Days'
  },
  {
    'Vendor Code': 'VND-3002',
    'Vendor Name': 'Apex Alloy & Fasteners',
    'Company Name': 'Apex Alloy Works',
    'GST Number': '24AAACB9876G1Z2',
    'PAN Number': 'AAACB9876G',
    'Contact Person': 'Ramesh Patel',
    'Mobile Number': '9823456789',
    'Email': 'ramesh@apexfasteners.com',
    'Material Supplied': 'Industrial Fasteners & Bolts',
    'Vendor Category': 'Fasteners',
    'Address Line 1': 'GIDC Phase 2',
    'City': 'Ahmedabad',
    'State': 'Gujarat',
    'PIN Code': '380015',
    'Country': 'India',
    'Payment Terms': 'Net 45',
    'Lead Time': '5 Days'
  }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendors');

XLSX.writeFile(workbook, '../Sample_Vendors.xlsx');
console.log('Sample_Vendors.xlsx created successfully in the project root!');
