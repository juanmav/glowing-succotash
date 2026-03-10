import Anthropic from '@anthropic-ai/sdk';
import type { CarData, FormFillCommand } from './types.js';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a form-filling assistant for bank loan applications. Given the HTML of a bank loan form and the details of a car being financed, return a JSON array of commands to fill the form fields with the car's information.

Rules:
- Return ONLY a valid JSON array, no markdown, no explanations
- Each command must have: "action" (one of: "fill", "select", "click", "check"), "selector" (a CSS selector targeting the field), and "value" (the value to set, omit for "click")
- Use "fill" for text inputs and textareas
- Use "select" for <select> dropdowns
- Use "click" for buttons or radio inputs
- Use "check" for checkboxes, with value "true" or "false"
- Use the most specific and reliable CSS selector possible (prefer id selectors like "#vin", then name selectors like "[name='vin']", then descriptive selectors)
- Map car fields to relevant loan form fields (VIN, make, model, year, price/loan amount, mileage, condition, etc.)
- Skip fields that have no corresponding car data or are not related to vehicle information
- Return an empty array [] if no relevant fields are found`;

const USER_PROMPT_TEMPLATE = (car: CarData, html: string, sourceUrl: string) => `Fill out this bank loan form with the following car details.

Car Details:
${JSON.stringify(car, null, 2)}

Form Page URL: ${sourceUrl}

Form HTML:
${html}

Return a JSON array of commands to fill the form. Example format:
[
  { "action": "fill", "selector": "#vin", "value": "1HGBH41JXMN109186" },
  { "action": "fill", "selector": "[name='make']", "value": "Honda" },
  { "action": "select", "selector": "#vehicle-year", "value": "2022" },
  { "action": "fill", "selector": "#loan-amount", "value": "24500" }
]`;

export async function fillLoanForm(
  car: CarData,
  html: string,
  sourceUrl: string
): Promise<FormFillCommand[]> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: USER_PROMPT_TEMPLATE(car, html, sourceUrl),
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
    throw new Error(`Failed to parse Claude response as JSON: ${content.text}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Claude returned a non-array response for form fill commands');
  }

  return parsed as FormFillCommand[];
}
