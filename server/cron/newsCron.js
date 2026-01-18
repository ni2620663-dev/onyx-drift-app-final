// cron/newsCron.js
import cron from "node-cron";
import { fetchRSSNews } from "../services/rssFetcher.js";

cron.schedule("*/10 * * * *", async () => {
  console.log("🕒 Checking for new news...");
  await fetchRSSNews();
});
