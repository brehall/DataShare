import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const status = (err as any).status || (err as any).statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

let serverInitialized = false;

async function initializeServer() {
  if (serverInitialized) return;

  const server = await registerRoutes(app);

  // In production (Vercel), serve static files
  if (app.get("env") !== "development") {
    serveStatic(app);
  }

  // For development only
  if (app.get("env") === "development") {
    await setupVite(app, server);

    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  }

  serverInitialized = true;
  return server;
}

// For Vercel serverless functions, we need to initialize synchronously
if (process.env.VERCEL || app.get("env") !== "development") {
  // Initialize server immediately for production/Vercel
  initializeServer().catch(console.error);
} else {
  // Initialize server for development
  initializeServer();
}

// Export the Express app for Vercel
export default app;