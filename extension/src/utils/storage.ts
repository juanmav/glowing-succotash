import type { StorageConfig } from '../types/car.js';

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
