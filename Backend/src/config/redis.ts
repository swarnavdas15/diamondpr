import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(REDIS_URL);

redisClient.on('connect', () => {
  console.log('🟢 Connected to Redis successfully');
});

redisClient.on('error', (err) => {
  console.error('🔴 Redis connection error:', err);
});

export default redisClient;
