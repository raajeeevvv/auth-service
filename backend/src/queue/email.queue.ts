import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null, // required by BullMQ
});


// this adds job to redis
export const emailQueue = new Queue('email-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, then 10s, then 20s
    },
    removeOnComplete: 100, // keep last 100 completed jobs, discard rest
    removeOnFail: 500,     // keep more failed jobs around for inspection
  },
});