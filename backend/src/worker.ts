import dotenv from "dotenv";
dotenv.config();
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { sendVerificationEmail, sendResetEmail } from "./service/email.service";

const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "email-queue",
  async (job: Job) => {
    switch (job.name) {
      case "send-verification-email":
        await sendVerificationEmail(job.data.email, job.data.link);
        break;
      case "send-reset-email":
        await sendResetEmail(job.data.email, job.data.link);
        break;
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} (${job.name}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} (${job?.name}) failed:`, err.message);
});

console.log("Email worker started, listening for jobs...");