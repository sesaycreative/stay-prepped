// Shared building blocks for tool islands. Kept small and dependency-free.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Download, Printer, RotateCcw } from 'lucide-react';

/* ----------------------------------------------------------------------------
   Local storage: tool state stays on this device only (brief §0 #12, §12).
   Every access is wrapped because storage can be blocked or unavailable.
---------------------------------------------------------------------------- */
export function readStorage<T>(key: string, validate: (v: unknown) => v is T): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Persist a form state object in localStorage. Loads after mount (so the
 * server-rendered HTML and first client render match) and saves on change.
 */
export function usePersistentForm<T extends object>(key: string, initial: T, validate: (v: unknown) => v is T) {
  const [state, setState] = useState<T>(initial);
  const loaded = useRef(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const saved = readStorage(key, validate);
    if (saved) {
      setState({ ...initial, ...saved });
      setRestored(true);
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (loaded.current) writeStorage(key, state);
  }, [key, state]);

  const reset = () => {
    removeStorage(key);
    setState(initial);
    setRestored(false);
  };

  return { state, setState, restored, reset } as const;
}

/* ----------------------------------------------------------------------------
   Downloads are generated in the browser; nothing is sent to a server.
---------------------------------------------------------------------------- */
export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ToolActions(props: {
  textFile?: { name: string; content: () => string };
  csvFile?: { name: string; content: () => string };
  onReset?: () => void;
  resetLabel?: string;
}) {
  return (
    <div className="no-print flex flex-wrap gap-2" role="group" aria-label="Save or print your results">
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}>
        <Printer size={18} aria-hidden="true" /> Print
      </button>
      {props.textFile && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => downloadFile(props.textFile!.name, props.textFile!.content(), 'text/plain')}
        >
          <Download size={18} aria-hidden="true" /> Download checklist (.txt)
        </button>
      )}
      {props.csvFile && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => downloadFile(props.csvFile!.name, props.csvFile!.content(), 'text/csv')}
        >
          <Download size={18} aria-hidden="true" /> Download spreadsheet (.csv)
        </button>
      )}
      {props.onReset && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={props.onReset}>
          <RotateCcw size={18} aria-hidden="true" /> {props.resetLabel ?? 'Clear saved inputs'}
        </button>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Form fields
---------------------------------------------------------------------------- */
export function NumberField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  help?: string;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  const describedBy = [props.help ? helpId : '', props.error ? errId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {props.label}
      </label>
      {props.help && (
        <span id={helpId} className="field-help">
          {props.help}
        </span>
      )}
      <div className="flex items-center gap-2">
        <input
          id={id}
          className="input"
          style={{ maxWidth: '8rem' }}
          type="number"
          inputMode="numeric"
          step={1}
          min={props.min ?? 0}
          max={props.max}
          value={props.value}
          aria-invalid={props.error ? 'true' : undefined}
          aria-describedby={describedBy}
          onChange={(e) => props.onChange(e.target.value)}
        />
        {props.suffix && <span className="muted">{props.suffix}</span>}
      </div>
      {props.error && (
        <span id={errId} className="field-error">
          {props.error}
        </span>
      )}
    </div>
  );
}

export function ChoiceGroup<T extends string>(props: {
  legend: string;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  help?: string;
}) {
  const id = useId();
  return (
    <fieldset aria-describedby={props.help ? `${id}-help` : undefined}>
      <legend>{props.legend}</legend>
      {props.help && (
        <p id={`${id}-help`} className="field-help" style={{ marginTop: '-0.2rem', marginBottom: '0.45rem' }}>
          {props.help}
        </p>
      )}
      <div className="choice-row">
        {props.options.map((o) => (
          <label key={o.value} className="choice">
            <input
              type="radio"
              name={`${props.name}-${id}`}
              value={o.value}
              checked={props.value === o.value}
              onChange={() => props.onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DaysField(props: { value: string; onChange: (v: string) => void; error?: string }) {
  const presets = ['3', '7', '14', '30', '90'];
  const isPreset = presets.includes(props.value);
  const [custom, setCustom] = useState(!isPreset);
  useEffect(() => {
    if (!presets.includes(props.value)) setCustom(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);
  const id = useId();
  const mode = custom ? 'custom' : props.value;
  return (
    <fieldset>
      <legend>How many days to plan for</legend>
      <div className="choice-row">
        {presets.map((d) => (
          <label key={d} className="choice">
            <input
              type="radio"
              name={`days-${id}`}
              value={d}
              checked={mode === d}
              onChange={() => {
                setCustom(false);
                props.onChange(d);
              }}
            />
            <span>{d} days</span>
          </label>
        ))}
        <label className="choice">
          <input type="radio" name={`days-${id}`} value="custom" checked={custom} onChange={() => setCustom(true)} />
          <span>Custom</span>
        </label>
      </div>
      {custom && (
        <div className="mt-3">
          <NumberField
            label="Custom number of days"
            help="Any whole number from 1 to 365."
            value={props.value}
            onChange={props.onChange}
            error={props.error}
            min={1}
            max={365}
            suffix="days"
          />
        </div>
      )}
      {!custom && props.error && <span className="field-error">{props.error}</span>}
    </fieldset>
  );
}

export function EmptyResult({ children }: { children: ReactNode }) {
  return <p className="muted">{children}</p>;
}

export const fmt = (n: number, dp = 0) =>
  n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });

/** Convert a validated numeric string to a number. */
export const num = (s: string) => Number(s);
