import Anthropic from '@anthropic-ai/sdk';
import type { CarData } from './types.js';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a car data extraction specialist. Given the HTML of a car listing webpage, extract all available car information and return it as a JSON array.

Rules:
- Return ONLY a valid JSON array, no markdown, no explanations
- If the page shows a single car detail page, return an array with one object
- If the page shows a list of cars (search results, inventory, etc.), return one object per car
- Use null for any field not found for a specific car
- For numeric fields (price, mileage, year, doors), return numbers not strings
- Normalize transmission to one of: "automatic", "manual", "cvt", "other"
- Normalize fuelType to one of: "gasoline", "diesel", "electric", "hybrid", "other"
- Normalize condition to one of: "new", "used", "certified"
- Normalize mileageUnit to "km" or "mi"
- For VIN: must be exactly 17 alphanumeric characters (no I, O, Q)
- For price: strip currency symbols and commas, return bare number
- For description: max 300 characters summary per listing`;

const USER_PROMPT_TEMPLATE = (html: string, sourceUrl: string) => `Extract all car data from this webpage.
Source URL: ${sourceUrl}

HTML:
${html}

Return a JSON array where each element has these fields:
{
  "vin": string|null,
  "make": string|null,
  "model": string|null,
  "year": number|null,
  "trim": string|null,
  "price": number|null,
  "priceCurrency": string|null,
  "mileage": number|null,
  "mileageUnit": "km"|"mi"|null,
  "color": string|null,
  "transmission": "automatic"|"manual"|"cvt"|"other"|null,
  "fuelType": "gasoline"|"diesel"|"electric"|"hybrid"|"other"|null,
  "engine": string|null,
  "bodyStyle": string|null,
  "driveType": string|null,
  "doors": number|null,
  "condition": "new"|"used"|"certified"|null,
  "stockNumber": string|null,
  "description": string|null
}`;

function normalizeRaw(parsed: unknown, sourceUrl: string): CarData[] {
  const now = new Date().toISOString();

  const mapItem = (raw: Record<string, unknown>): CarData => ({
    vin: (raw.vin as string | null) ?? null,
    make: (raw.make as string | null) ?? null,
    model: (raw.model as string | null) ?? null,
    year: (raw.year as number | null) ?? null,
    trim: (raw.trim as string | null) ?? null,
    price: (raw.price as number | null) ?? null,
    priceCurrency: (raw.priceCurrency as string | null) ?? null,
    mileage: (raw.mileage as number | null) ?? null,
    mileageUnit: (raw.mileageUnit as 'km' | 'mi' | null) ?? null,
    color: (raw.color as string | null) ?? null,
    transmission: (raw.transmission as CarData['transmission']) ?? null,
    fuelType: (raw.fuelType as CarData['fuelType']) ?? null,
    engine: (raw.engine as string | null) ?? null,
    bodyStyle: (raw.bodyStyle as string | null) ?? null,
    driveType: (raw.driveType as string | null) ?? null,
    doors: (raw.doors as number | null) ?? null,
    condition: (raw.condition as CarData['condition']) ?? null,
    stockNumber: (raw.stockNumber as string | null) ?? null,
    description: (raw.description as string | null) ?? null,
    sourceUrl,
    extractedAt: now,
  });

  // Handle both array and single-object responses from Claude
  if (Array.isArray(parsed)) {
    return parsed.map((item) => mapItem(item as Record<string, unknown>));
  }
  if (parsed && typeof parsed === 'object') {
    return [mapItem(parsed as Record<string, unknown>)];
  }
  return [];
}

export async function extractCarData(html: string, sourceUrl: string): Promise<CarData[]> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: USER_PROMPT_TEMPLATE(html, sourceUrl),
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  let parsed: unknown;
  try {
    const text = content.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${content.text.slice(0, 200)}`);
  }

  const results = normalizeRaw(parsed, sourceUrl);
  if (results.length === 0) {
    throw new Error('No car data found on this page');
  }
  return results;
}
