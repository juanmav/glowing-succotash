export interface CarData {
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  price: number | null;
  priceCurrency: string | null;
  mileage: number | null;
  mileageUnit: 'km' | 'mi' | null;
  color: string | null;
  transmission: 'automatic' | 'manual' | 'cvt' | 'other' | null;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'other' | null;
  engine: string | null;
  bodyStyle: string | null;
  driveType: string | null;
  doors: number | null;
  condition: 'new' | 'used' | 'certified' | null;
  stockNumber: string | null;
  description: string | null;
  sourceUrl: string;
  extractedAt: string;
}

export interface StorageConfig {
  backendUrl: string;
  apiEndpointUrl: string;
  apiAuthToken: string;
}

export const EMPTY_CAR_DATA: Omit<CarData, 'sourceUrl' | 'extractedAt'> = {
  vin: null,
  make: null,
  model: null,
  year: null,
  trim: null,
  price: null,
  priceCurrency: null,
  mileage: null,
  mileageUnit: null,
  color: null,
  transmission: null,
  fuelType: null,
  engine: null,
  bodyStyle: null,
  driveType: null,
  doors: null,
  condition: null,
  stockNumber: null,
  description: null,
};
