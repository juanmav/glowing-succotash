interface Props {
  type: 'info' | 'success' | 'error';
  message: string;
}

const colors = {
  info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  error:   { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
};

export default function StatusBar({ type, message }: Props) {
  const c = colors[type];
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 12,
        lineHeight: 1.5,
        wordBreak: 'break-word',
      }}
    >
      {message}
    </div>
  );
}
