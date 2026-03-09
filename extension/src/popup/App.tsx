import { useState, useCallback } from 'react';
import type { CarData } from '../types/car.js';
import CarForm from './components/CarForm.js';
import StatusBar from './components/StatusBar.js';

type AppState = 'idle' | 'scanning' | 'scanned' | 'pushing' | 'pushed' | 'error';

interface Status {
  type: 'info' | 'success' | 'error';
  message: string;
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', minHeight: 400, padding: 12, gap: 12 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: 700, color: '#111827' },
  subtitle: { fontSize: 11, color: '#6b7280' },
  actions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
  btn: {
    padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: 13, transition: 'opacity .15s',
  },
  btnPrimary: { background: '#2563eb', color: '#fff' },
  btnSuccess: { background: '#16a34a', color: '#fff' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  optionsLink: {
    fontSize: 11, color: '#6b7280', textDecoration: 'none', cursor: 'pointer',
    background: 'none', border: 'none', padding: 0,
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 8, color: '#9ca3af', textAlign: 'center', padding: 24,
  },
  emptyIcon: { fontSize: 40 },
};

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [carData, setCarData] = useState<CarData | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  const openOptions = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  const handleScan = useCallback(async () => {
    setState('scanning');
    setStatus({ type: 'info', message: 'Sending page to Claude for extraction...' });
    setCarData(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.runtime.sendMessage({
        type: 'SCAN_PAGE',
        tabId: tab.id,
      });

      if (!response.success) {
        throw new Error(response.error ?? 'Extraction failed');
      }

      setCarData(response.data);
      setState('scanned');
      setStatus({ type: 'success', message: 'Car data extracted. Review and push when ready.' });
    } catch (err) {
      setState('error');
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  const handlePush = useCallback(async () => {
    if (!carData) return;
    setState('pushing');
    setStatus({ type: 'info', message: 'Pushing to API...' });

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PUSH_DATA',
        data: carData,
      });

      if (!response.success) {
        throw new Error(response.error ?? 'Push failed');
      }

      setState('pushed');
      setStatus({ type: 'success', message: `Pushed successfully (HTTP ${response.statusCode})` });
    } catch (err) {
      setState('error');
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [carData]);

  const scanning = state === 'scanning';
  const pushing = state === 'pushing';
  const canPush = (state === 'scanned' || state === 'error') && carData !== null;
  const canScan = !scanning && !pushing;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Car Data Scraper</div>
          <div style={styles.subtitle}>Powered by Claude AI</div>
        </div>
        <button style={styles.optionsLink} onClick={openOptions}>
          Settings
        </button>
      </div>

      {/* Status */}
      {status && <StatusBar type={status.type} message={status.message} />}

      {/* Content */}
      {carData ? (
        <CarForm data={carData} onChange={setCarData} />
      ) : (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🚗</div>
          <div style={{ fontWeight: 600, color: '#374151' }}>No car data yet</div>
          <div style={{ fontSize: 12 }}>
            Navigate to a car listing page and click "Scan Page"
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button
          style={{
            ...styles.btn,
            ...styles.btnPrimary,
            ...(canScan ? {} : styles.btnDisabled),
          }}
          onClick={handleScan}
          disabled={!canScan}
        >
          {scanning ? 'Scanning...' : 'Scan Page'}
        </button>

        {canPush && (
          <button
            style={{
              ...styles.btn,
              ...styles.btnSuccess,
              ...(pushing ? styles.btnDisabled : {}),
            }}
            onClick={handlePush}
            disabled={pushing}
          >
            {pushing ? 'Pushing...' : 'Push to API'}
          </button>
        )}
      </div>
    </div>
  );
}
