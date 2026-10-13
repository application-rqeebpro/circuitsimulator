import type { Request, Response } from 'express';
import apiApp from '../src/server/apiApp';

// Vercel Serverless Function catch-all for all /api/* routes
export default function handler(req: Request, res: Response) {
  try {
    return apiApp(req, res);
  } catch (err: any) {
    console.error('Fatal API handler error on Vercel catch-all:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'حدث خطأ في الخادم أثناء معالجة الطلب',
        details: err?.message || 'Server error',
      });
    }
  }
}
