import { useState, useEffect, useCallback } from 'react';
import type { CarData } from '../types/car.js';
import { getPopupState, savePopupState } from '../utils/storage.js';
import type { PersistedPopupState } from '../utils/storage.js';
import CarForm from './components/CarForm.js';
import CarSelector from './components/CarSelector.js';
import StatusBar from './components/StatusBar.js';

type AppState =
  | 'idle'
  | 'scanning'
  | 'selecting'
  | 'scanned'
  | 'pushing'
  | 'pushed'
  | 'error'
  | 'loadingLoanCars'
  | 'selectingLoanCar'
  | 'loanCarSelected'
  | 'completingLoan'
  | 'loanCompleted';

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
  btnSecondary: { background: '#6b7280', color: '#fff' },
  btnSuccess: { background: '#16a34a', color: '#fff' },
  btnWarning: { background: '#d97706', color: '#fff' },
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
  loanCarCard: {
    border: '1px solid #d1fae5', borderRadius: 8, padding: 12, background: '#f0fdf4',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  loanCarCardTitle: { fontWeight: 700, fontSize: 14, color: '#065f46' },
  loanCarCardSub: { fontSize: 12, color: '#047857' },
};

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [carData, setCarData] = useState<CarData | null>(null);
  const [carList, setCarList] = useState<CarData[]>([]);
  const [loanCars, setLoanCars] = useState<CarData[]>([]);
  const [selectedLoanCar, setSelectedLoanCar] = useState<CarData | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    getPopupState().then((persisted) => {
      if (!persisted) return;
      setState(persisted.state);
      setCarData(persisted.carData);
      setCarList(persisted.carList);
      setLoanCars(persisted.loanCars ?? []);
      setSelectedLoanCar(persisted.selectedLoanCar ?? null);
      setStatus(persisted.status);
    });
  }, []);

  useEffect(() => {
    const transientStates: AppState[] = ['scanning', 'pushing', 'loadingLoanCars', 'completingLoan'];
    const persistedAppState: PersistedPopupState['state'] =
      transientStates.includes(state) ? 'idle' : state as PersistedPopupState['state'];

    savePopupState({
      state: persistedAppState,
      carData,
      carList,
      loanCars,
      selectedLoanCar,
      status,
    });
  }, [state, carData, carList, loanCars, selectedLoanCar, status]);

  const openOptions = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  const handleScan = useCallback(async () => {
    setState('scanning');
    setStatus({ type: 'info', message: 'Sending page to Claude for extraction...' });
    setCarData(null);
    setCarList([]);

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

      if (Array.isArray(response.data)) {
        setCarList(response.data);
        setState('selecting');
        setStatus({ type: 'info', message: `${response.data.length} cars found. Select one to continue.` });
      } else {
        setCarData(response.data);
        setState('scanned');
        setStatus({ type: 'success', message: 'Car data extracted. Review and push when ready.' });
      }
    } catch (err) {
      setState('error');
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  const handleSelectCar = useCallback((car: CarData) => {
    setCarData(car);
    setState('scanned');
    setStatus({ type: 'success', message: 'Car selected. Review and push when ready.' });
  }, []);

  const handleBackToList = useCallback(() => {
    setCarData(null);
    setState('selecting');
    setStatus({ type: 'info', message: `${carList.length} cars found. Select one to continue.` });
  }, [carList.length]);

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

  const handleLoadLoanCars = useCallback(async () => {
    setState('loadingLoanCars');
    setStatus({ type: 'info', message: 'Loading cars from backend...' });
    setLoanCars([]);
    setSelectedLoanCar(null);

    try {
      const response = await chrome.runtime.sendMessage({ type: 'LOAD_LOAN_CARS' });

      if (!response.success) {
        throw new Error(response.error ?? 'Failed to load cars');
      }

      setLoanCars(response.data);
      setState('selectingLoanCar');
      setStatus({ type: 'info', message: `${response.data.length} cars available. Select one for the loan.` });
    } catch (err) {
      setState('error');
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  const handleSelectLoanCar = useCallback((car: CarData) => {
    setSelectedLoanCar(car);
    setState('loanCarSelected');
    setStatus({ type: 'info', message: `Selected: ${car.year} ${car.make} ${car.model}. Navigate to the bank loan form and click "Complete loan details".` });
  }, []);

  const handleBackToLoanList = useCallback(() => {
    setSelectedLoanCar(null);
    setState('selectingLoanCar');
    setStatus({ type: 'info', message: `${loanCars.length} cars available. Select one for the loan.` });
  }, [loanCars.length]);

  const handleCompleteLoan = useCallback(async () => {
    if (!selectedLoanCar) return;
    setState('completingLoan');
    setStatus({ type: 'info', message: 'Analyzing form and filling details...' });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.runtime.sendMessage({
        type: 'COMPLETE_LOAN_FORM',
        car: selectedLoanCar,
        tabId: tab.id,
      });

      if (!response.success) {
        throw new Error(response.error ?? 'Form completion failed');
      }

      setState('loanCompleted');
      setStatus({
        type: 'success',
        message: response.commandCount > 0
          ? `Form filled with ${response.commandCount} field(s) completed.`
          : 'No matching fields found on this page.',
      });
    } catch (err) {
      setState('error');
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [selectedLoanCar]);

  const isBusy = ['scanning', 'pushing', 'loadingLoanCars', 'completingLoan'].includes(state);
  const scanning = state === 'scanning';
  const pushing = state === 'pushing';
  const selecting = state === 'selecting';
  const selectingLoanCar = state === 'selectingLoanCar';
  const canPush = (state === 'scanned' || state === 'error') && carData !== null;
  const canScan = !isBusy && !selecting;
  const canLoadLoanCars = !isBusy && !selecting && !selectingLoanCar;
  const canCompleteLoan = (state === 'loanCarSelected' || state === 'loanCompleted') && selectedLoanCar !== null;

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
      {selectingLoanCar ? (
        <CarSelector cars={loanCars} onSelect={handleSelectLoanCar} />
      ) : selecting ? (
        <CarSelector cars={carList} onSelect={handleSelectCar} />
      ) : state === 'loanCarSelected' || state === 'completingLoan' || state === 'loanCompleted' ? (
        selectedLoanCar && (
          <div style={styles.loanCarCard}>
            <div style={styles.loanCarCardTitle}>
              {selectedLoanCar.year} {selectedLoanCar.make} {selectedLoanCar.model}
              {selectedLoanCar.trim ? ` ${selectedLoanCar.trim}` : ''}
            </div>
            <div style={styles.loanCarCardSub}>
              {selectedLoanCar.price != null
                ? `${selectedLoanCar.priceCurrency ?? '$'}${selectedLoanCar.price.toLocaleString()}`
                : 'Price not available'}
              {selectedLoanCar.mileage != null
                ? ` · ${selectedLoanCar.mileage.toLocaleString()} ${selectedLoanCar.mileageUnit ?? ''}`
                : ''}
            </div>
            <div style={styles.loanCarCardSub}>
              VIN: {selectedLoanCar.vin ?? 'N/A'} · Stock: {selectedLoanCar.stockNumber ?? 'N/A'}
            </div>
          </div>
        )
      ) : carData ? (
        <CarForm data={carData} onChange={setCarData} />
      ) : (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🚗</div>
          <div style={{ fontWeight: 600, color: '#374151' }}>No car data yet</div>
          <div style={{ fontSize: 12 }}>
            Scan a listing page, or load cars to complete a loan form
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        {/* Back to car list (scan flow) */}
        {carList.length > 0 && (state === 'scanned' || state === 'error') && (
          <button style={{
            ...styles.btn,
            ...styles.btnSecondary,
            marginRight: 'auto'
          }} onClick={handleBackToList}>
            ← Back to list
          </button>
        )}

        {/* Back to loan car list */}
        {(state === 'loanCarSelected' || state === 'loanCompleted') && (
          <button style={{
            ...styles.btn,
            ...styles.btnSecondary,
            marginRight: 'auto'
          }} onClick={handleBackToLoanList}>
            ← Back to loan cars
          </button>
        )}

        {/* Scan Page button */}
        <button
          style={{
            ...styles.btn,
            ...styles.btnPrimary,
            ...(canScan ? {} : styles.btnDisabled),
          }}
          onClick={handleScan}
          disabled={!canScan}
        >
          {scanning ? 'Scanning...' : selecting ? 'Select a car...' : 'Scan Page'}
        </button>

        {/* Load cars for loan button — always visible alongside Scan Page */}
        {!selecting && !selectingLoanCar && state !== 'loanCarSelected' && state !== 'completingLoan' && state !== 'loanCompleted' && (
          <button
            style={{
              ...styles.btn,
              ...styles.btnWarning,
              ...(canLoadLoanCars ? {} : styles.btnDisabled),
            }}
            onClick={handleLoadLoanCars}
            disabled={!canLoadLoanCars}
          >
            {state === 'loadingLoanCars' ? 'Loading...' : 'Load cars for loan'}
          </button>
        )}

        {/* Push to API button */}
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

        {/* Complete loan details button */}
        {canCompleteLoan && (
          <button
            style={{
              ...styles.btn,
              ...styles.btnSuccess,
              ...(state === 'completingLoan' ? styles.btnDisabled : {}),
            }}
            onClick={handleCompleteLoan}
            disabled={state === 'completingLoan'}
          >
            {state === 'completingLoan' ? 'Filling form...' : 'Complete loan details'}
          </button>
        )}
      </div>
    </div>
  );
}
