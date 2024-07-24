import chalk from "chalk";
import schedule from "node-schedule";
import { enquiry } from "../controllers/service-gateway/mpay/gateway";

let job: any = null;

export const start = () => {
  job = schedule.scheduleJob("*/15 * * * *", async () => {
    try {
      await enquiry();
      console.log(chalk.yellowBright.inverse("enquiry job started"));
    } catch (e) {
      console.error(e);
    }
  });
};

export const cancel = () => {
  if (job) {
    job.cancel();
  }
};

// */30 * * * *    ทุก 30 นาที
// * * * * *    ทุกๆนาที
