import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 ERP Backend running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('<h1>Hello welcome to the ERP</h1>');
});