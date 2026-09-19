import "dotenv/config";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 MomentumOS Backend running on http://localhost:${PORT}`);
  console.log(`⚡ API endpoints available at http://localhost:${PORT}/api`);
});
