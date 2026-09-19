import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import tasksRouter from "./routes/tasks.js";
import habitsRouter from "./routes/habits.js";
import calendarRouter from "./routes/calendar.js";
import analyticsRouter from "./routes/analytics.js";
import quotesRouter from "./routes/quotes.js";

export function createApp() {
  const app = express();

  const allowedOrigins = [
    process.env.CORS_ORIGIN || "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173"
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // allow requests with no origin like mobile apps, curl, or server-to-server
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.startsWith("http://localhost:")) {
          return callback(null, true);
        }
        return callback(null, true); // Dev convenience
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: "1mb" }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "MomentumOS REST API"
    });
  });

  // Mount API modules
  app.use("/api/auth", authRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/habits", habitsRouter);
  app.use("/api/calendar", calendarRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/quotes", quotesRouter);
  // Also mount /api/motivate directly as specified in Section 12
  app.use("/api", quotesRouter);

  // Global 404 handler for unmatched API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.originalUrl} not found` });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || "Internal Server Error"
    });
  });

  return app;
}
