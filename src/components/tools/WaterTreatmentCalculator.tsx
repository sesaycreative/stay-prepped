import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Ban, Timer } from 'lucide-react';
import {
  STRENGTH_LABEL,
  WATER_TREATMENT,
  bleachDose,
  feetToMetres,
  formatClock,
  secondsLeft,
  treatmentCardText,
  validateLitres,
  type BleachStrength,
  type Clarity,
  type Method,
} from '../../lib/calculators/waterTreatment';
import { ChoiceGroup, ToolActions, fmt, usePersistentForm } from './ui';

interface FormState {
  litres: string;
  clarity: Clarity;
  method: Method;
  strength: BleachStrength;
  tabletMinutes: string;
}
const INITIAL: FormState = { litres: '5', clarity: 'clear', method: 'boil', strength: 'standard', tabletMinutes: '' };
const STORAGE_KEY = 'stayprepped:water-treatment:v1';
const METHODS: { id: Method; label: string }[] = [
  { id: 'boil', label: 'Boil' },
  { id: 'bleach', label: 'Household bleach' },
  { id: 'tablets', label: 'Purification tablets' },
  { id: 'filter', label: 'Filter' },
];

function isFormState(v: unknown): v is FormState {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.litres === 'string' &&
    (o.clarity === 'clear' || o.clarity === 'cloudy') &&
    METHODS.some((m) => m.id === o.method) &&
    (o.strength === 'standard' || o.strength === 'one' || o.strength === 'other') &&
    (o.tabletMinutes === undefined || typeof o.tabletMinutes === 'string')
  );
}

type TimerState = { endsAt: string; litres: number; method: string } | undefined;

function WaitTimer(props: { minutes: number | null; litres: number; method: Method; label: string }) {
  const [timer, setTimer] = useState<TimerState>(undefined);
  const [now, setNow] = useState(() => Date.now());
  const pg = useRef<typeof import('../../lib/progress') | null>(null);

  useEffect(() => {
    let off = () => {};
    void import('../../lib/progress').then((m) => {
      pg.current = m;
      setTimer(m.progress().get().waterTimer);
      off = m.progress().subscribe((s) => setTimer(s.waterTimer));
    });
    return () => off();
  }, []);

  const running = !!timer && Date.parse(timer.endsAt) > now;
  const finished = !!timer && !running;
  useEffect(() => {
    if (!timer) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timer?.endsAt]);

  const left = timer ? secondsLeft(new Date(timer.endsAt), new Date(now)) : 0;
  const start = () => {
    if (!props.minutes) return;
    pg.current?.progress().setWaterTimer({ endsAt: new Date(Date.now() + props.minutes * 60_000).toISOString(), litres: props.litres, method: props.method });
  };
  const stop = () => pg.current?.progress().setWaterTimer(undefined);
  const forThis = timer?.method === props.method;

  return (
    <div className="timer no-print" data-state={running ? 'running' : 'idle'}>
      <Timer size={22} aria-hidden="true" />
      <div className="grid gap-1" style={{ flex: '1 1 12rem' }}>
        <span className="timer-face" aria-hidden="true">
          {timer ? formatClock(left) : props.minutes ? formatClock(props.minutes * 60) : '–:––'}
        </span>
        <span className="field-help" role="status" aria-live="polite">
          {running
            ? `Waiting${forThis ? '' : ` (${timer!.method})`}: about ${Math.ceil(left / 60)} min left. Ends at ${new Date(timer!.endsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}. Saved if you reload.`
            : finished
              ? 'Time is up. Do the smell check below before you drink it.'
              : props.label}
        </span>
      </div>
      {timer ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={stop}>
          {finished ? 'Clear timer' : 'Stop timer'}
        </button>
      ) : (
        <button type="button" className="btn btn-primary btn-sm" onClick={start} disabled={!props.minutes}>
          Start {props.minutes ? `${props.minutes}-minute` : ''} timer
        </button>
      )}
    </div>
  );
}

export default function WaterTreatmentCalculator() {
  const { state, setState, restored, reset } = usePersistentForm(STORAGE_KEY, INITIAL, isFormState);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setState((s) => ({ ...s, [k]: v }));
  const litresError = validateLitres(state.litres);
  const litres = litresError ? null : Number(state.litres);
  const dose = litres !== null ? bleachDose(litres, state.strength, state.clarity) : null;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabMinutesNum = /^\d{1,3}$/.test(state.tabletMinutes) && Number(state.tabletMinutes) >= 1 && Number(state.tabletMinutes) <= 240 ? Number(state.tabletMinutes) : null;
  const tabMinutesError = state.tabletMinutes && tabMinutesNum === null ? 'Enter the waiting time from the packet, in whole minutes from 1 to 240.' : undefined;

  const onTabKey = (e: KeyboardEvent, i: number) => {
    const n = METHODS.length;
    let j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = n - 1;
    if (j < 0) return;
    e.preventDefault();
    set('method', METHODS[j].id);
    tabRefs.current[j]?.focus();
  };

  const L = (n: number) => `${n.toLocaleString('en-GB', { maximumFractionDigits: 2 })} ${n === 1 ? 'litre' : 'litres'}`;
  const highM = fmt(feetToMetres(WATER_TREATMENT.highAltitudeFeet));

  return (
    <div className="grid gap-6">
      <div className="callout callout-safety" style={{ marginBlock: 0 }}>
        <Ban size={20} aria-hidden="true" className="icon" />
        <div>
          <p>
            <strong>Follow your water company’s notice first.</strong> If you have a boil water notice, or have been told to stop using your water, do exactly what it says. This tool is for when you have no safe water and no instructions.
          </p>
          <p>
            <strong>Never mix bleach with ammonia or any other cleaner.</strong> It can give off toxic fumes.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
        <form className="panel no-print grid gap-5" onSubmit={(e) => e.preventDefault()} aria-labelledby="wt-form-title" noValidate>
          <h2 id="wt-form-title" className="text-xl">
            Your water
          </h2>
          {restored && (
            <p className="field-help" role="status">
              We restored the inputs you used last time on this device.
            </p>
          )}
          <fieldset className="grid gap-2">
            <legend>How much water?</legend>
            <div className="quick-row">
              {['1', '5', '10', '25'].map((v) => (
                <button key={v} type="button" className="quick-btn" aria-pressed={state.litres === v} onClick={() => set('litres', v)}>
                  {v} L
                </button>
              ))}
            </div>
            <label className="field-label mt-2" htmlFor="wt-litres">
              Or enter litres
            </label>
            <div className="flex items-center gap-2">
              <input
                id="wt-litres"
                className="input"
                style={{ maxWidth: '8rem' }}
                type="number"
                inputMode="decimal"
                min={WATER_TREATMENT.minLitres}
                max={WATER_TREATMENT.maxLitres}
                step="any"
                value={state.litres}
                aria-invalid={litresError ? 'true' : undefined}
                aria-describedby={litresError ? 'wt-litres-err' : undefined}
                onChange={(e) => set('litres', e.target.value)}
              />
              <span className="muted">litres</span>
            </div>
            {litresError && (
              <span id="wt-litres-err" className="field-error">
                {litresError}
              </span>
            )}
          </fieldset>
          <ChoiceGroup<Clarity>
            legend="What does it look like?"
            name="clarity"
            value={state.clarity}
            onChange={(v) => set('clarity', v)}
            help="Cloudy includes murky, coloured or very cold water."
            options={[
              { value: 'clear', label: 'Clear' },
              { value: 'cloudy', label: 'Cloudy' },
            ]}
          />
          {state.clarity === 'cloudy' && (
            <p className="field-help">
              First let it settle and pour off the clear water, or strain it through a clean cloth, paper towel or coffee filter.
            </p>
          )}
          <p className="field-help">Saved in this browser only. Nothing is sent to us.</p>
        </form>

        <section className="panel results grid gap-5" aria-labelledby="wt-results-title">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="wt-results-title" className="text-xl">
              How to treat it
            </h2>
            {litres !== null && (
              <ToolActions
                textFile={{ name: 'water-treatment-card.txt', content: () => treatmentCardText(litres, state.clarity, state.method, state.strength), label: 'Download card (.txt)' }}
                onReset={reset}
              />
            )}
          </div>

          <div className="tablist no-print" role="tablist" aria-label="Treatment method">
            {METHODS.map((m, i) => (
              <button
                key={m.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`wt-tab-${m.id}`}
                type="button"
                role="tab"
                className="tab"
                aria-selected={state.method === m.id}
                aria-controls="wt-panel"
                tabIndex={state.method === m.id ? 0 : -1}
                onClick={() => set('method', m.id)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="print-only" style={{ fontWeight: 700 }}>
            Method: {METHODS.find((m) => m.id === state.method)!.label}
          </p>

          <div id="wt-panel" role="tabpanel" aria-labelledby={`wt-tab-${state.method}`} className="tabpanel">
            {litres === null ? (
              <p className="muted">Enter how many litres to see the steps.</p>
            ) : state.method === 'boil' ? (
              <>
                <p className="big-figure">
                  {WATER_TREATMENT.boilMinutes} min <small>at a rolling boil</small>
                </p>
                <ol className="grid gap-2" style={{ listStyle: 'decimal', paddingLeft: '1.4rem' }}>
                  {state.clarity === 'cloudy' && <li>Let the water settle, or strain it through a clean cloth, first.</li>}
                  <li>Bring {L(litres)} to a rolling boil.</li>
                  <li>
                    Keep it boiling for {WATER_TREATMENT.boilMinutes} minute. Above {fmt(WATER_TREATMENT.highAltitudeFeet)} feet (about {highM} metres), boil for {WATER_TREATMENT.boilMinutesHigh} minutes.
                  </li>
                  <li>Take it off the heat and let it cool naturally.</li>
                  <li>Store it covered, in a clean container in the fridge. Throw away any you have not used within {WATER_TREATMENT.boiledStoreHours} hours.</li>
                </ol>
                <p className="field-help">Take care: boiling water can cause scalds.</p>
                <WaitTimer minutes={WATER_TREATMENT.boilMinutes} litres={litres} method="boil" label="Start this once the water reaches a rolling boil." />
              </>
            ) : state.method === 'bleach' ? (
              <>
                <ChoiceGroup<BleachStrength>
                  legend="Strength on the label (sodium hypochlorite)"
                  name="strength"
                  value={state.strength}
                  onChange={(v) => set('strength', v)}
                  help="Look for the sodium hypochlorite percentage on the label."
                  options={(['standard', 'one', 'other'] as const).map((v) => ({ value: v, label: STRENGTH_LABEL[v] }))}
                />
                {dose && dose.ok ? (
                  <>
                    <div aria-live="polite" aria-atomic="true">
                      <p className="big-figure">
                        {fmt(dose.drops)} drops <small>about {dose.mlLabel}</small>
                      </p>
                      <p className="muted mt-1">
                        for {L(litres)} of {state.clarity} water{dose.doubled ? ', double the clear-water dose' : ''}.
                      </p>
                    </div>
                    <ol className="grid gap-2" style={{ listStyle: 'decimal', paddingLeft: '1.4rem' }}>
                      <li>Use plain, unscented household bleach that is less than a year old. Check the label: no scent, no “colour safe”, no added cleaners.</li>
                      <li>
                        Add {fmt(dose.drops)} drops ({dose.mlLabel}) with a clean dropper{dose.drops > 40 ? ', or measure the millilitres with an oral syringe or measuring spoon' : ''}.
                      </li>
                      <li>Stir, cover, and wait at least {dose.waitMinutes} minutes.</li>
                      <li>
                        Smell it. It should smell slightly of chlorine. If it does not, add the same dose again and wait another {WATER_TREATMENT.repeatWaitMinutes} minutes. If it still does not, use another method.
                      </li>
                    </ol>
                    <p className="field-help">
                      A drop is taken as about {WATER_TREATMENT.mlPerDrop} ml, which matches the US CDC’s published pairs (2 drops = 0.1 ml). Droppers vary, so the millilitres are the figure to trust.
                    </p>
                    <WaitTimer minutes={dose.waitMinutes} litres={litres} method="bleach" label={`Start this when you have stirred in the bleach.`} />
                  </>
                ) : (
                  dose && (
                    <div className="status-card" data-light="red">
                      <span className="status-tag">No safe dose</span>
                      <p>{dose.reason}</p>
                    </div>
                  )
                )}
              </>
            ) : state.method === 'tablets' ? (
              <>
                <p>
                  <strong>Follow the instructions on the packet exactly</strong>, including how many tablets to use for {L(litres)} and how long to wait. Tablets differ, so we do not give a dose.
                </p>
                <ul className="grid gap-2" style={{ listStyle: 'disc', paddingLeft: '1.3rem' }}>
                  <li>Check the use-by date and read the leaflet before you start.</li>
                  <li>If the water is cloudy, let it settle or strain it first, and check what the packet says about cloudy water.</li>
                </ul>
                <div className="field">
                  <label className="field-label" htmlFor="wt-tab-min">
                    Waiting time on your packet
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="wt-tab-min"
                      className="input"
                      style={{ maxWidth: '6rem' }}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={240}
                      value={state.tabletMinutes}
                      aria-invalid={tabMinutesError ? 'true' : undefined}
                      aria-describedby={tabMinutesError ? 'wt-tab-min-err' : undefined}
                      onChange={(e) => set('tabletMinutes', e.target.value)}
                    />
                    <span className="muted">minutes</span>
                  </div>
                  {tabMinutesError && (
                    <span id="wt-tab-min-err" className="field-error">
                      {tabMinutesError}
                    </span>
                  )}
                </div>
                <WaitTimer minutes={tabMinutesNum} litres={litres} method="tablets" label="Enter the waiting time from your packet, then start the timer." />
              </>
            ) : (
              <>
                <p>
                  <strong>A filter alone is not enough during a boil water notice.</strong> Most portable filters do not remove viruses.
                </p>
                <ul className="grid gap-2" style={{ listStyle: 'disc', paddingLeft: '1.3rem' }}>
                  <li>To remove bacteria, the filter needs an absolute pore size of 0.3 microns or smaller. For parasites such as Cryptosporidium, 1 micron or smaller.</li>
                  <li>After filtering, disinfect the water too: boil it, or use bleach or tablets as above.</li>
                  <li>Use the filter as its maker says, and replace cartridges on time.</li>
                </ul>
              </>
            )}
          </div>

          <div>
            <h3 className="mb-2">Do not use</h3>
            <ul className="do-list">
              <li data-light="red">
                <b>Never</b>
                <span>Water that may contain fuel, toxic chemicals or radioactive material. Boiling and bleach cannot make it safe. Use bottled water.</span>
              </li>
              <li data-light="red">
                <b>Never</b>
                <span>Scented or colour-safe bleach, bleach with added cleaners, or bleach whose strength you cannot read on the label.</span>
              </li>
              <li data-light="red">
                <b>Never</b>
                <span>Bleach mixed with any other cleaner or chemical.</span>
              </li>
              <li data-light="amber">
                <b>Avoid</b>
                <span>Dirty or open containers. Store treated water in clean, sanitised containers with tight lids.</span>
              </li>
            </ul>
          </div>

          <p className="field-help">
            A planning aid based on Drinking Water Inspectorate, US CDC and US EPA guidance. Follow official notices. If someone is ill after drinking water, call NHS 111, or 999 in an emergency. See also the{' '}
            <a href="/guides/emergency-water-purification/">water purification guide</a> and <a href="/local-risk/">your local risks</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
