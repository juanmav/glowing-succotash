import { useState, useEffect } from 'react';
import { getConfig, saveConfig } from '../utils/storage.js';
import type { StorageConfig } from '../types/car.js';

const s: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 10,
    padding: 32,
    boxShadow: '0 1px 4px rgba(0,0,0,.1)',
    width: '100%',
    maxWidth: 520,
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  title: { fontSize: 22, fontWeight: 700, color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  section: { display: 'flex', flexDirection: 'column', gap: 14 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: 8 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  hint: { fontSize: 11, color: '#9ca3af' },
  input: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    color: '#111827',
    background: '#fff',
    outline: 'none',
    width: '100%',
  },
  actions: { display: 'flex', gap: 10, alignItems: 'center' },
  btn: {
    padding: '9px 20px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  btnSave: { background: '#2563eb', color: '#fff' },
  btnTest: { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
  feedback: { fontSize: 12, marginLeft: 4 },
};

type TestResult = { ok: boolean; message: string } | null;

export default function Options() {
  const [config, setConfig] = useState<StorageConfig>({
    backendUrl: 'http://localhost:3000',
    apiEndpointUrl: '',
    apiAuthToken: '',
  });
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getConfig().then(setConfig);
  }, []);

  const handleSave = async () => {
    await saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const url = config.backendUrl.replace(/\/$/, '') + '/health';
      const resp = await fetch(url);
      if (resp.ok) {
        setTestResult({ ok: true, message: `Backend reachable (HTTP ${resp.status})` });
      } else {
        setTestResult({ ok: false, message: `HTTP ${resp.status} — check backend URL` });
      }
    } catch (err) {
      setTestResult({ ok: false, message: `Connection failed: ${String(err)}` });
    } finally {
      setTesting(false);
    }
  };

  const update = (key: keyof StorageConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfig((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div style={s.card}>
      <div>
        <div style={s.title}>Car Scraper Settings</div>
        <div style={s.subtitle}>Configure your extraction backend and destination API.</div>
      </div>

      {/* Backend section */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Extraction Backend</div>

        <div style={s.field}>
          <label style={s.label}>Backend URL</label>
          <input
            style={s.input}
            type="url"
            placeholder="http://localhost:3000"
            value={config.backendUrl}
            onChange={update('backendUrl')}
          />
          <span style={s.hint}>
            URL of your running backend server (the one that calls Claude AI).
          </span>
        </div>

        <div style={s.actions}>
          <button style={{ ...s.btn, ...s.btnTest }} onClick={handleTest} disabled={testing}>
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          {testResult && (
            <span style={{ ...s.feedback, color: testResult.ok ? '#15803d' : '#dc2626' }}>
              {testResult.ok ? '✓' : '✗'} {testResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Destination API section */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Destination API</div>

        <div style={s.field}>
          <label style={s.label}>API Endpoint URL</label>
          <input
            style={s.input}
            type="url"
            placeholder="https://your-api.com/cars"
            value={config.apiEndpointUrl}
            onChange={update('apiEndpointUrl')}
          />
          <span style={s.hint}>
            Where to POST car data when you click "Push to API" in the popup.
          </span>
        </div>

        <div style={s.field}>
          <label style={s.label}>Auth Token (optional)</label>
          <input
            style={s.input}
            type="password"
            placeholder="Bearer token or API key"
            value={config.apiAuthToken}
            onChange={update('apiAuthToken')}
          />
          <span style={s.hint}>
            Sent as <code>Authorization: Bearer &lt;token&gt;</code> if provided.
          </span>
        </div>
      </div>

      <div style={s.actions}>
        <button style={{ ...s.btn, ...s.btnSave }} onClick={handleSave}>
          Save Settings
        </button>
        {saved && (
          <span style={{ ...s.feedback, color: '#15803d' }}>✓ Saved</span>
        )}
      </div>
    </div>
  );
}
