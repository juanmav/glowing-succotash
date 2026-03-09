import Anthropic from '@anthropic-ai/sdk';
import type { CarData } from './types.js';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a car data extraction specialist. Given the HTML of a car listing webpage, extract all available car information and return it as JSON.

Rules:
- Return ONLY valid JSON, no markdown, no explanations
- If the page shows a SINGLE car listing, return a single JSON object
- If the page shows MULTIPLE car listings (search results, inventory list, etc.), return a JSON array of objects, one per car
- Use null for any field not found on the page
- For numeric fields (price, mileage, year, doors), return numbers not strings
- Normalize transmission to one of: "automatic", "manual", "cvt", "other"
- Normalize fuelType to one of: "gasoline", "diesel", "electric", "hybrid", "other"
- Normalize condition to one of: "new", "used", "certified"
- Normalize mileageUnit to "km" or "mi"
- For VIN: must be exactly 17 alphanumeric characters (no I, O, Q)
- For price: strip currency symbols and commas, return bare number
- For description: max 300 characters summary of the listing`;

const USER_PROMPT_TEMPLATE = (html: string, sourceUrl: string) => `Extract car data from this webpage.
Source URL: ${sourceUrl}

HTML:
${html}

If this is a single car listing, return a single JSON object.
If this is a list/search page with multiple cars, return a JSON array of objects.

Each car object should have these fields:
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

function mapParsedToCar(parsed: Record<string, unknown>, sourceUrl: string): CarData {
  return {
    vin: (parsed.vin as string | null) ?? null,
    make: (parsed.make as string | null) ?? null,
    model: (parsed.model as string | null) ?? null,
    year: (parsed.year as number | null) ?? null,
    trim: (parsed.trim as string | null) ?? null,
    price: (parsed.price as number | null) ?? null,
    priceCurrency: (parsed.priceCurrency as string | null) ?? null,
    mileage: (parsed.mileage as number | null) ?? null,
    mileageUnit: (parsed.mileageUnit as 'km' | 'mi' | null) ?? null,
    color: (parsed.color as string | null) ?? null,
    transmission: (parsed.transmission as CarData['transmission']) ?? null,
    fuelType: (parsed.fuelType as CarData['fuelType']) ?? null,
    engine: (parsed.engine as string | null) ?? null,
    bodyStyle: (parsed.bodyStyle as string | null) ?? null,
    driveType: (parsed.driveType as string | null) ?? null,
    doors: (parsed.doors as number | null) ?? null,
    condition: (parsed.condition as CarData['condition']) ?? null,
    stockNumber: (parsed.stockNumber as string | null) ?? null,
    description: (parsed.description as string | null) ?? null,
    sourceUrl,
    extractedAt: new Date().toISOString(),
  };
}

export async function extractCarData(html: string, sourceUrl: string): Promise<CarData | CarData[]> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
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

  let parsed: Record<string, unknown> | Record<string, unknown>[];
  try {
    // Strip any markdown code fences if Claude included them
    const text = content.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${content.text}`);
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item) => mapParsedToCar(item as Record<string, unknown>, sourceUrl));
  }

  return mapParsedToCar(parsed, sourceUrl);
}
