import express, { Router } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { healthBody, historyBody, rankingBody } from './api/_final';
import { FINAL_CONFIRMED_DATA } from './src/data/finalArchive';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  // whsp-home の /sh/202609 配下で配信する (vite.config.ts の base と揃える)
  const BASE_PATH = '/sh/202609';
  const api = Router();

  app.use(express.json());
  app.get('/', (_req, res) => res.redirect(`${BASE_PATH}/`));
  app.use(`${BASE_PATH}/api`, api);

  // API (Vercel では api/*.ts が同じレスポンスを返す)
  api.get('/health', (_req, res) => res.json(healthBody()));
  api.get('/ranking', (_req, res) => res.json(rankingBody()));
  api.get('/history', (_req, res) => res.json(historyBody()));
  api.post('/refresh', (_req, res) => res.json(rankingBody()));

  // Vite middleware for dev / static files for production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(BASE_PATH, express.static(distPath));
    app.get(`${BASE_PATH}/*`, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Final Archived Server running at http://localhost:${PORT}`);
    console.log(`[Server] External SHOWROOM API: STOPPED`);
    console.log(`[Server] Firestore Database: DELETED & DISCONNECTED`);
    console.log(`[Server] Mode: 100% Frozen Final Results (${FINAL_CONFIRMED_DATA.data.total_score.toLocaleString()} pt)`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
