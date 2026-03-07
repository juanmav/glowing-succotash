interface Props {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  select?: string[];
  textarea?: boolean;
  monospace?: boolean;
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '110px 1fr',
  alignItems: 'start',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#6b7280',
  fontWeight: 600,
  paddingTop: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '4px 8px',
  fontSize: 13,
  border: '1px solid #d1d5db',
  borderRadius: 4,
  outline: 'none',
  background: '#fff',
  color: '#111827',
};

export default function FieldRow({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  select,
  textarea,
  monospace,
}: Props) {
  const displayValue = value == null ? '' : String(value);

  const extraStyle: React.CSSProperties = monospace
    ? { fontFamily: 'monospace', fontSize: 11 }
    : {};

  return (
    <div style={rowStyle}>
      <label style={labelStyle}>{label}</label>
      {select ? (
        <select
          style={inputBase}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          {select.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          style={{ ...inputBase, ...extraStyle, resize: 'vertical', minHeight: 56 }}
          value={displayValue}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          style={{ ...inputBase, ...extraStyle }}
          type={type}
          value={displayValue}
          placeholder={placeholder ?? (value == null ? '—' : undefined)}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
