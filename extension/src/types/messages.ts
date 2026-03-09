import type { CarData } from './car.js';

export type MessageToBackground =
  | { type: 'SCAN_PAGE'; tabId: number }
  | { type: 'PUSH_DATA'; data: CarData };

export type MessageToContent = { type: 'CAPTURE_HTML' };

export type BackgroundResponse =
  | { success: true; data: CarData }
  | { success: false; error: string };

export type PushResponse =
  | { success: true; statusCode: number }
  | { success: false; error: string };
