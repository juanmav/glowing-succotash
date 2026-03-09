import type { CarData } from '../../types/car.js';
import FieldRow from './FieldRow.js';

interface Props {
  data: CarData;
  onChange: (updated: CarData) => void;
  onBack?: () => void;
}

function set<K extends keyof CarData>(data: CarData, key: K, value: CarData[K]): CarData {
  return { ...data, [key]: value };
}

export default function CarForm({ data, onChange, onBack }: Props) {
  const update = (key: keyof CarData, raw: string) => {
    const numericFields: (keyof CarData)[] = ['year', 'price', 'mileage', 'doors'];
    if (numericFields.includes(key)) {
      const n = raw === '' ? null : Number(raw);
      onChange(set(data, key, (isNaN(n as number) ? null : n) as CarData[typeof key]));
    } else {
      onChange(set(data, key, (raw === '' ? null : raw) as CarData[typeof key]));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 420 }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#6b7280', padding: '0 0 4px 0',
            textAlign: 'left', alignSelf: 'flex-start',
          }}
        >
          ← Back to list
        </button>
      )}
      <FieldRow label="VIN"          value={data.vin}           onChange={(v) => update('vin', v)} monospace />
      <FieldRow label="Make"         value={data.make}          onChange={(v) => update('make', v)} />
      <FieldRow label="Model"        value={data.model}         onChange={(v) => update('model', v)} />
      <FieldRow label="Year"         value={data.year}          onChange={(v) => update('year', v)} type="number" />
      <FieldRow label="Trim"         value={data.trim}          onChange={(v) => update('trim', v)} />
      <FieldRow label="Price"        value={data.price}         onChange={(v) => update('price', v)} type="number" />
      <FieldRow label="Currency"     value={data.priceCurrency} onChange={(v) => update('priceCurrency', v)} placeholder="USD" />
      <FieldRow label="Mileage"      value={data.mileage}       onChange={(v) => update('mileage', v)} type="number" />
      <FieldRow label="Mileage unit" value={data.mileageUnit}   onChange={(v) => update('mileageUnit', v)}
        select={['km', 'mi']} />
      <FieldRow label="Color"        value={data.color}         onChange={(v) => update('color', v)} />
      <FieldRow label="Transmission" value={data.transmission}  onChange={(v) => update('transmission', v)}
        select={['automatic', 'manual', 'cvt', 'other']} />
      <FieldRow label="Fuel type"    value={data.fuelType}      onChange={(v) => update('fuelType', v)}
        select={['gasoline', 'diesel', 'electric', 'hybrid', 'other']} />
      <FieldRow label="Engine"       value={data.engine}        onChange={(v) => update('engine', v)} />
      <FieldRow label="Body style"   value={data.bodyStyle}     onChange={(v) => update('bodyStyle', v)} />
      <FieldRow label="Drive type"   value={data.driveType}     onChange={(v) => update('driveType', v)} />
      <FieldRow label="Doors"        value={data.doors}         onChange={(v) => update('doors', v)} type="number" />
      <FieldRow label="Condition"    value={data.condition}     onChange={(v) => update('condition', v)}
        select={['new', 'used', 'certified']} />
      <FieldRow label="Stock #"      value={data.stockNumber}   onChange={(v) => update('stockNumber', v)} />
      <FieldRow label="Description"  value={data.description}   onChange={(v) => update('description', v)} textarea />
      <FieldRow label="Source URL"   value={data.sourceUrl}     onChange={(v) => update('sourceUrl', v)} />
    </div>
  );
}
