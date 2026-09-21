import "dotenv/config";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 MomentumOS Backend running on port ${PORT}`);
  console.log(`⚡ API endpoints available at /api`);
});
