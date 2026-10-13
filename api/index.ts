import app from '../server';
import type { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  try {
    // If Vercel rewrites stripped the leading '/api', re-add it so Express routes match
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    return app(req, res);
  } catch (error: any) {
    console.error('Vercel serverless function invocation error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'خطأ في معالجة طلب الخادم (Serverless Invocation Error)',
        details: error?.message || 'Unknown error'
      });
    }
  }
}
