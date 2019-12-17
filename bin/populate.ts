import { Metric, MetricsHandler } from "../src/metrics";
import fs = require("fs");

const dir: string = "./db";
if (!fs.existsSync(dir)) fs.mkdirSync(dir);
const db: MetricsHandler = new MetricsHandler(dir + "/metrics");

const met: Metric[] = [
  new Metric(`${new Date("2019-11-04 14:00 UTC").getTime()}`, 12),
  new Metric(`${new Date("2019-11-04 14:15 UTC").getTime()}`, 10),
  new Metric(`${new Date("2019-11-04 14:30 UTC").getTime()}`, 8)
];

db.save("0", met, (err: Error | null) => {
  if (err) throw err;
  console.log("Data populated");
});
