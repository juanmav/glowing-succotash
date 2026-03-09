import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { extractCarData } from './extractCarData.js';
import type { ExtractRequest, ExtractResponse, ExtractErrorResponse } from './types.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// CORS — restrict to allowed origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : true; // allow all origins if not set

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '5mb' })); // full HTML pages can be large

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Car data extraction endpoint
app.post(
  '/extract',
  async (
    req: Request<object, ExtractResponse | ExtractErrorResponse, ExtractRequest>,
    res: Response<ExtractResponse | ExtractErrorResponse>
  ) => {
    const { html, sourceUrl } = req.body;

    if (!html || typeof html !== 'string') {
      res.status(400).json({ success: false, error: 'Missing or invalid "html" field' });
      return;
    }
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      res.status(400).json({ success: false, error: 'Missing or invalid "sourceUrl" field' });
      return;
    }

    try {
      const data = await extractCarData(html, sourceUrl);
      res.json({ success: true, data });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[extract] Error:', message);
      res.status(500).json({ success: false, error: message });
    }
  }
);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[unhandled]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Car data extraction backend running on http://localhost:${PORT}`);
  console.log(`  POST /extract  — extract car data from HTML`);
  console.log(`  GET  /health   — health check`);
});
