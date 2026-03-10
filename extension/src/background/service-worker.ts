import { getConfig } from '../utils/storage.js';
import type { CarData } from '../types/car.js';
import type { FormFillCommand } from '../types/loan.js';

// Ensure content script is loaded in the given tab, then send a message to it.
async function sendToContentScript<T>(
  tabId: number,
  message: object
): Promise<T> {
  // First ping to see if the content script is already running
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
  } catch {
    // Not running — inject it now
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content-script.js'],
    });
  }
  return chrome.tabs.sendMessage(tabId, message) as Promise<T>;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCAN_PAGE') {
    handleScanPage(message.tabId)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true; // keep channel open for async response
  }

  if (message.type === 'PUSH_DATA') {
    handlePushData(message.data)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }

  if (message.type === 'LOAD_LOAN_CARS') {
    handleLoadLoanCars()
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }

  if (message.type === 'COMPLETE_LOAN_FORM') {
    handleCompleteLoanForm(message.car, message.tabId)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }
});

async function handleScanPage(tabId: number) {
  const config = await getConfig();

  if (!config.backendUrl) {
    return { success: false, error: 'No backend URL configured. Open Options to set one.' };
  }

  // Ask content script to capture the page HTML
  const captureResult = await sendToContentScript<{
    success: boolean;
    html?: string;
    sourceUrl?: string;
    error?: string;
  }>(tabId, { type: 'CAPTURE_HTML' });

  if (!captureResult.success || !captureResult.html) {
    return { success: false, error: captureResult.error ?? 'Failed to capture page HTML' };
  }

  // Send HTML to our backend, which calls Claude
  const backendUrl = config.backendUrl.replace(/\/$/, '');
  let resp: Response;
  try {
    resp = await fetch(`${backendUrl}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: captureResult.html,
        sourceUrl: captureResult.sourceUrl,
      }),
    });
  } catch (err) {
    return { success: false, error: `Network error reaching backend: ${String(err)}` };
  }

  const json = await resp.json().catch(() => ({ success: false, error: `HTTP ${resp.status}` }));

  if (!resp.ok || !json.success) {
    return { success: false, error: json.error ?? `Backend returned HTTP ${resp.status}` };
  }

  return { success: true, data: json.data };
}

async function handlePushData(data: CarData) {
  const config = await getConfig();

  if (!config.apiEndpointUrl) {
    return { success: false, error: 'No API endpoint configured. Open Options to set one.' };
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiAuthToken) {
    headers['Authorization'] = `Bearer ${config.apiAuthToken}`;
  }

  let resp: Response;
  try {
    resp = await fetch(config.apiEndpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  } catch (err) {
    return { success: false, error: `Network error: ${String(err)}` };
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    return {
      success: false,
      error: `HTTP ${resp.status}: ${body.slice(0, 300)}`,
    };
  }

  return { success: true, statusCode: resp.status };
}

async function handleLoadLoanCars() {
  const config = await getConfig();

  if (!config.backendUrl) {
    return { success: false, error: 'No backend URL configured. Open Options to set one.' };
  }

  const backendUrl = config.backendUrl.replace(/\/$/, '');
  let resp: Response;
  try {
    resp = await fetch(`${backendUrl}/cars`);
  } catch (err) {
    return { success: false, error: `Network error reaching backend: ${String(err)}` };
  }

  const json = await resp.json().catch(() => ({ success: false, error: `HTTP ${resp.status}` }));

  if (!resp.ok || !json.success) {
    return { success: false, error: json.error ?? `Backend returned HTTP ${resp.status}` };
  }

  return { success: true, data: json.data };
}

async function handleCompleteLoanForm(car: CarData, tabId: number) {
  const config = await getConfig();

  if (!config.backendUrl) {
    return { success: false, error: 'No backend URL configured. Open Options to set one.' };
  }

  // Capture current page HTML
  const captureResult = await sendToContentScript<{
    success: boolean;
    html?: string;
    sourceUrl?: string;
    error?: string;
  }>(tabId, { type: 'CAPTURE_HTML' });

  if (!captureResult.success || !captureResult.html) {
    return { success: false, error: captureResult.error ?? 'Failed to capture page HTML' };
  }

  // Ask Claude to generate fill commands
  const backendUrl = config.backendUrl.replace(/\/$/, '');
  let resp: Response;
  try {
    resp = await fetch(`${backendUrl}/fill-loan-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        car,
        html: captureResult.html,
        sourceUrl: captureResult.sourceUrl,
      }),
    });
  } catch (err) {
    return { success: false, error: `Network error reaching backend: ${String(err)}` };
  }

  const json = await resp.json().catch(() => ({ success: false, error: `HTTP ${resp.status}` }));

  if (!resp.ok || !json.success) {
    return { success: false, error: json.error ?? `Backend returned HTTP ${resp.status}` };
  }

  const commands: FormFillCommand[] = json.commands;

  if (commands.length === 0) {
    return { success: true, commandCount: 0 };
  }

  // Send commands to content script for execution
  const execResult = await sendToContentScript<{ success: boolean; error?: string }>(tabId, {
    type: 'EXECUTE_COMMANDS',
    commands,
  });

  if (!execResult.success) {
    return { success: false, error: execResult.error ?? 'Failed to execute form fill commands' };
  }

  return { success: true, commandCount: commands.length };
}
