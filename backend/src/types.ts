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

export interface ExtractRequest {
  html: string;
  sourceUrl: string;
}

export interface ExtractResponse {
  success: true;
  data: CarData | CarData[];
}

export interface ExtractErrorResponse {
  success: false;
  error: string;
}
