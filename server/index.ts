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

async function initializeServer() {
  const server = await registerRoutes(app);

  // Serve static files in production (Vercel)
  if (process.env.NODE_ENV !== "development") {
    serveStatic(app);
  }

  return server;
}

// Initialize the server synchronously for Vercel
initializeServer().catch((err) => {
  console.error("Server initialization failed:", err);
});

// Export the Express app for Vercel
export default app;