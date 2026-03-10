import type { CarData } from './car.js';
import type { FormFillCommand } from './loan.js';

export type MessageToBackground =
  | { type: 'SCAN_PAGE'; tabId: number }
  | { type: 'PUSH_DATA'; data: CarData }
  | { type: 'LOAD_LOAN_CARS' }
  | { type: 'COMPLETE_LOAN_FORM'; car: CarData; tabId: number };

export type MessageToContent =
  | { type: 'CAPTURE_HTML' }
  | { type: 'PING' }
  | { type: 'EXECUTE_COMMANDS'; commands: FormFillCommand[] };

export type BackgroundResponse =
  | { success: true; data: CarData | CarData[] }
  | { success: false; error: string };

export type PushResponse =
  | { success: true; statusCode: number }
  | { success: false; error: string };

export type LoanCarsResponse =
  | { success: true; data: CarData[] }
  | { success: false; error: string };

export type CompleteLoanResponse =
  | { success: true; commandCount: number }
  | { success: false; error: string };
