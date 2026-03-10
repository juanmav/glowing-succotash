import type { StorageConfig, CarData } from '../types/car.js';

const DEFAULTS: StorageConfig = {
  backendUrl: 'http://localhost:3000',
  apiEndpointUrl: '',
  apiAuthToken: '',
};

export async function getConfig(): Promise<StorageConfig> {
  const result = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...result } as StorageConfig;
}

export async function saveConfig(config: Partial<StorageConfig>): Promise<void> {
  await chrome.storage.sync.set(config);
}

const POPUP_STATE_KEY = 'popupState';

export interface PersistedPopupState {
  state: 'idle' | 'selecting' | 'scanned' | 'pushed' | 'error' | 'selectingLoanCar' | 'loanCarSelected' | 'loanCompleted';
  carData: CarData | null;
  carList: CarData[];
  loanCars: CarData[];
  selectedLoanCar: CarData | null;
  status: { type: 'info' | 'success' | 'error'; message: string } | null;
}

export async function getPopupState(): Promise<PersistedPopupState | null> {
  try {
    const result = await chrome.storage.local.get(POPUP_STATE_KEY);
    const raw = result[POPUP_STATE_KEY];
    if (!raw || typeof raw !== 'object') return null;
    return raw as PersistedPopupState;
  } catch {
    return null;
  }
}

export async function savePopupState(ps: PersistedPopupState): Promise<void> {
  try {
    await chrome.storage.local.set({ [POPUP_STATE_KEY]: ps });
  } catch {
    // best-effort
  }
}

export async function clearPopupState(): Promise<void> {
  try {
    await chrome.storage.local.remove(POPUP_STATE_KEY);
  } catch {
    // best-effort
  }
}
