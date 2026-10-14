import type { Request, Response } from 'express';
import apiApp from '../src/server/apiApp';

/**
 * Vercel Serverless Function Entry Point for /api
 * Handles all API routes, URL path normalization, and error isolation
 */
export default function handler(req: Request, res: Response) {
  // If Vercel rewrote the path to /api but the original route is in Vercel headers, restore it
  const originalPath = 
    (req.headers['x-matched-path'] as string) || 
    (req.headers['x-forwarded-uri'] as string) || 
    (req.headers['x-vercel-matched-path'] as string);

  if (originalPath && (req.url === '/api' || req.url === '/api/' || req.url === '/')) {
    req.url = originalPath;
  }

  return apiApp(req, res);
}
