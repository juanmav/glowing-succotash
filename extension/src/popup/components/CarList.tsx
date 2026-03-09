import type { CarData } from '../../types/car.js';

interface Props {
  cars: CarData[];
  onSelect: (car: CarData) => void;
}

function carLabel(car: CarData): string {
  const parts = [car.year, car.make, car.model, car.trim].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unknown vehicle';
}

function carSubtitle(car: CarData): string {
  const parts: string[] = [];
  if (car.price != null) {
    const sym = car.priceCurrency === 'USD' ? '$' : (car.priceCurrency ?? '');
    parts.push(`${sym}${car.price.toLocaleString()}`);
  }
  if (car.mileage != null) parts.push(`${car.mileage.toLocaleString()} ${car.mileageUnit ?? ''}`);
  if (car.color) parts.push(car.color);
  if (car.condition) parts.push(car.condition);
  return parts.join(' · ');
}

export default function CarList({ cars, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto', maxHeight: 420 }}>
      <div style={{ fontSize: 12, color: '#6b7280', padding: '0 0 8px 0', fontWeight: 600 }}>
        {cars.length} cars found — select one to review
      </div>
      {cars.map((car, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(car)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 2,
            padding: '10px 12px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            cursor: 'pointer',
            textAlign: 'left',
            marginBottom: 6,
            transition: 'background .1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
            {carLabel(car)}
          </span>
          {carSubtitle(car) && (
            <span style={{ fontSize: 11, color: '#6b7280' }}>{carSubtitle(car)}</span>
          )}
          {car.vin && (
            <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>
              VIN: {car.vin}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
