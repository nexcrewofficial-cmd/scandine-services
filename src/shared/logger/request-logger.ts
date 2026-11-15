import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime();

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(3);
    const contentLength = res.getHeader("content-length") || "-";
    const status = res.statusCode;
    const url = req.originalUrl || req.url;

    console.log(`${req.method} ${url} ${status} ${contentLength} - ${durationMs} ms`);
  });

  next();
};
