import cron from 'node-cron';

let healthPingCount = 0;
let lastHealthCheckTime: string | null = null;

/**
 * Health Counter Background Cron Job
 * Runs every 14 minutes ('*\/14 * * * *') to maintain a background service health counter and log activity.
 * This is an isolated background process that does not affect any existing ERP business logic.
 */
export const initHealthCron = () => {
  console.log('💚 [Health Cron] Service initialized. Scheduled to run every 14 minutes.');

  // Perform initial ping on startup
  healthPingCount++;
  lastHealthCheckTime = new Date().toISOString();

  // Cron schedule: Every 14 minutes
  cron.schedule('*/14 * * * *', () => {
    healthPingCount++;
    lastHealthCheckTime = new Date().toISOString();
    console.log(`💚 [Health Cron] Health Check #${healthPingCount} completed at ${lastHealthCheckTime}`);
  });
};

export const getHealthStats = () => {
  return {
    healthPingCount,
    lastHealthCheckTime,
    uptimeSeconds: Math.floor(process.uptime()),
  };
};
