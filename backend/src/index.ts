import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { extractCarData } from './extractCarData.js';
import { getCars } from './carRepository.js';
import { fillLoanForm } from './fillLoanForm.js';
import type {
  ExtractRequest,
  ExtractResponse,
  ExtractErrorResponse,
  FillLoanFormRequest,
  FillLoanFormResponse,
  CarsListResponse,
} from './types.js';

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

// Car inventory endpoint
app.get('/cars', (_req, res: Response<CarsListResponse>) => {
  res.json({ success: true, data: getCars() });
});

// Loan form fill endpoint
app.post(
  '/fill-loan-form',
  async (
    req: Request<object, FillLoanFormResponse | ExtractErrorResponse, FillLoanFormRequest>,
    res: Response<FillLoanFormResponse | ExtractErrorResponse>
  ) => {
    const { car, html, sourceUrl } = req.body;

    if (!car || typeof car !== 'object') {
      res.status(400).json({ success: false, error: 'Missing or invalid "car" field' });
      return;
    }
    if (!html || typeof html !== 'string') {
      res.status(400).json({ success: false, error: 'Missing or invalid "html" field' });
      return;
    }
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      res.status(400).json({ success: false, error: 'Missing or invalid "sourceUrl" field' });
      return;
    }

    try {
      const commands = await fillLoanForm(car, html, sourceUrl);
      res.json({ success: true, commands });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[fill-loan-form] Error:', message);
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
  console.log(`  POST /extract        — extract car data from HTML`);
  console.log(`  GET  /health         — health check`);
  console.log(`  GET  /cars           — list cars available for loan`);
  console.log(`  POST /fill-loan-form — generate form-fill commands for loan page`);
});
