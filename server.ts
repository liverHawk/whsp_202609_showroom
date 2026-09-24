import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { FINAL_CONFIRMED_DATA, FINAL_HISTORY_DATA } from './src/data/finalArchive';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      mode: 'archived_final',
      isEventEnded: true,
      isEventFrozen: true,
      isFinalResult: true,
      timestamp: Date.now(),
    });
  });

  // Ranking endpoint: Returns the definitive frozen final results
  app.get('/api/ranking', (_req, res) => {
    res.json({
      ...FINAL_CONFIRMED_DATA,
      isEventEnded: true,
      isEventFrozen: true,
      isFinalResult: true,
      apiStopped: true,
      dbDeleted: true,
      message: 'イベント終了・最終結果確定済み（外部API停止・データベース削除完了）',
    });
  });

  // Score History endpoint: Returns the full frozen history snapshots
  app.get('/api/history', (_req, res) => {
    res.json({
      history: FINAL_HISTORY_DATA,
      count: FINAL_HISTORY_DATA.length,
      isFinalResult: true,
    });
  });

  // Refresh endpoint: Confirms results are final and external API calls are stopped
  app.post('/api/refresh', (_req, res) => {
    res.json({
      ...FINAL_CONFIRMED_DATA,
      isEventEnded: true,
      isEventFrozen: true,
      isFinalResult: true,
      apiStopped: true,
      dbDeleted: true,
      message: 'イベント終了・最終結果確定済み（外部API停止・データベース削除完了）',
    });
  });

  // Vite middleware for dev / static files for production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
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
