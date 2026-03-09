import type { CarData } from '../../types/car.js';

interface CarSelectorProps {
  cars: CarData[];
  onSelect: (car: CarData) => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 8 },
  heading: { fontSize: 13, fontWeight: 600, color: '#374151' },
  list: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' },
  card: {
    padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb',
    cursor: 'pointer', background: '#fff', textAlign: 'left',
    transition: 'background .1s, border-color .1s',
  },
  cardTitle: { fontSize: 13, fontWeight: 600, color: '#111827' },
  cardMeta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
};

function carLabel(car: CarData): string {
  const parts = [car.year, car.make, car.model, car.trim].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unknown Car';
}

function carMeta(car: CarData): string {
  const parts: string[] = [];
  if (car.price != null) {
    const currency = car.priceCurrency ?? '';
    parts.push(`${currency}${car.price.toLocaleString()}`);
  }
  if (car.mileage != null) {
    parts.push(`${car.mileage.toLocaleString()} ${car.mileageUnit ?? ''}`.trim());
  }
  if (car.color) parts.push(car.color);
  if (car.condition) parts.push(car.condition);
  return parts.join(' · ');
}

export default function CarSelector({ cars, onSelect }: CarSelectorProps) {
  return (
    <div style={styles.container}>
      <div style={styles.heading}>{cars.length} cars found — select one to edit and push:</div>
      <div style={styles.list}>
        {cars.map((car, i) => {
          const meta = carMeta(car);
          return (
            <button
              key={i}
              style={styles.card}
              onClick={() => onSelect(car)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
              }}
            >
              <div style={styles.cardTitle}>{carLabel(car)}</div>
              {meta && <div style={styles.cardMeta}>{meta}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
