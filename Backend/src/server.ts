import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('<h1>Hello welcome to the ERP</h1>');
});

app.listen(PORT, () => {
  console.log(`🚀 Manufacturing ERP Backend Server running on port ${PORT}`);
});
