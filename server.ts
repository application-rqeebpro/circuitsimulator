import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiApp from './src/server/apiApp';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Mount all backend API routes
app.use(apiApp);

// ==========================================
// Vite Middleware / Production Static Serve
// ==========================================
async function startServer() {
  if (process.env.VERCEL) {
    return;
  }

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ مختبر الدوائر الكهربائية – أكاديمية الميكاترونكس اليمنية يعمل الآن على: http://localhost:${PORT}`);
  });
}

// Only start standalone server when executed directly as script
const isServerlessEnv = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NOW_REGION;
const isMainModule = !isServerlessEnv && process.argv[1] && (
  process.argv[1].endsWith('server.ts') || 
  process.argv[1].endsWith('server.js')
);

if (isMainModule) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}

export default app;
