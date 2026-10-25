import { useEffect, useRef, useState } from 'react';
import { Phone, Zap } from 'lucide-react';
import {
  FOOD_SAFETY,
  HOUR,
  assessOutage,
  formatDuration,
  freezerHeadline,
  fridgeHeadline,
  outageSummaryText,
  validateOutage,
  type ApplianceStatus,
  type DoorUse,
  type FreezerFill,
  type Light,
  type OutageInputs,
} from '../../lib/calculators/foodSafety';
import type { OutageState } from '../../lib/progress';
import { ChoiceGroup, ToolActions } from './ui';

/* datetime-local values are local time, "YYYY-MM-DDTHH:mm". */
const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fromLocalInput = (v: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const fmtTime = (d: Date, now: Date) => {
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return sameDay ? `${time} today` : `${time} on ${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`;
};

const QUICK = [
  { label: 'Just now', hours: 0 },
  { label: '1 hour ago', hours: 1 },
  { label: '4 hours ago', hours: 4 },
  { label: 'Overnight (8 hours ago)', hours: 8 },
];

const DOOR_OPTIONS: { value: DoorUse; label: string }[] = [
  { value: 'shut', label: 'Kept shut' },
  { value: 'few', label: 'Opened once or twice' },
  { value: 'lots', label: 'Opened a lot' },
];

const LIGHT_WORD: Record<Light, string> = { green: 'Within the window', amber: 'Act soon', red: 'Window passed' };
const worst = (a: Light | undefined, b: Light | undefined): Light => {
  const rank = { green: 0, amber: 1, red: 2 } as const;
  const x = a ?? 'green';
  const y = b ?? 'green';
  return rank[x] >= rank[y] ? x : y;
};

interface Form {
  offAt: string;
  restoredAt: string;
  hasFridge: boolean;
  fridgeDoor: DoorUse;
  freezerFill: FreezerFill;
  freezerDoor: DoorUse;
}

function Track({ s, now, label }: { s: ApplianceStatus; now: Date; label: string }) {
  const pct = Math.min(100, (s.elapsedMs / s.windowMs) * 100);
  const hours = s.windowMs / HOUR;
  return (
    <div className="runway">
      <div
        className="window-track"
        role="img"
        aria-label={`${label}: ${formatDuration(s.elapsedMs)} of the ${hours}-hour window used`}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="window-scale" aria-hidden="true">
        <span>Power off</span>
        <span>{hours} h · {fmtTime(s.endsAt, now)}</span>
      </div>
    </div>
  );
}

export default function PowerCutFoodSafety() {
  const [now, setNow] = useState<Date | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [tracking, setTracking] = useState(false);
  const [restored, setRestored] = useState(false);
  const store = useRef<typeof import('../../lib/progress') | null>(null);

  // Load after mount: the saved outage (if any) and the real clock.
  useEffect(() => {
    const t = new Date();
    setNow(t);
    let cancelled = false;
    void import('../../lib/progress').then((pg) => {
      if (cancelled) return;
      store.current = pg;
      const o = pg.progress().get().outage;
      if (o) {
        setForm({
          offAt: toLocalInput(new Date(o.offAt)),
          restoredAt: o.restoredAt ? toLocalInput(new Date(o.restoredAt)) : '',
          hasFridge: o.hasFridge,
          fridgeDoor: o.fridgeDoor,
          freezerFill: o.freezerFill,
          freezerDoor: o.freezerDoor,
        });
        setTracking(true);
        setRestored(true);
      } else {
        setForm({ offAt: toLocalInput(t), restoredAt: '', hasFridge: true, fridgeDoor: 'shut', freezerFill: 'full', freezerDoor: 'shut' });
      }
    });
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    const onVis = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const offAt = form ? fromLocalInput(form.offAt) : null;
  const restoredAt = form && form.restoredAt ? fromLocalInput(form.restoredAt) : null;
  const errors =
    form && now
      ? validateOutage(
          {
            offAt: offAt ?? undefined,
            restoredAt: form.restoredAt ? (restoredAt ?? new Date(NaN)) : null,
            hasFridge: form.hasFridge,
            freezerFill: form.freezerFill,
          },
          now,
        )
      : {};
  const valid = !!form && !!now && !!offAt && Object.keys(errors).length === 0;
  const input: OutageInputs | null = valid
    ? { offAt: offAt!, restoredAt, hasFridge: form!.hasFridge, fridgeDoor: form!.fridgeDoor, freezerFill: form!.freezerFill, freezerDoor: form!.freezerDoor }
    : null;
  const r = input && now ? assessOutage(input, now) : null;

  // Save to the progress store once the visitor has started tracking.
  useEffect(() => {
    if (!tracking || !input || !store.current) return;
    const o: OutageState = {
      offAt: input.offAt.toISOString(),
      ...(input.restoredAt ? { restoredAt: input.restoredAt.toISOString() } : {}),
      hasFridge: input.hasFridge,
      fridgeDoor: input.fridgeDoor,
      freezerFill: input.freezerFill,
      freezerDoor: input.freezerDoor,
    };
    store.current.progress().setOutage(o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking, form?.offAt, form?.restoredAt, form?.hasFridge, form?.fridgeDoor, form?.freezerFill, form?.freezerDoor, valid]);

  const change = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setTracking(true);
  };
  const quick = (hours: number) => {
    const t = new Date();
    setNow(t);
    change('offAt', toLocalInput(new Date(t.getTime() - hours * HOUR)));
  };
  const powerBackNow = () => {
    const t = new Date();
    setNow(t);
    change('restoredAt', toLocalInput(t));
  };
  const clear = () => {
    store.current?.progress().setOutage(undefined);
    const t = new Date();
    setNow(t);
    setForm({ offAt: toLocalInput(t), restoredAt: '', hasFridge: true, fridgeDoor: 'shut', freezerFill: 'full', freezerDoor: 'shut' });
    setTracking(false);
    setRestored(false);
  };

  if (!form || !now) {
    return (
      <div className="panel">
        <p className="muted">Loading the countdown…</p>
      </div>
    );
  }

  const overall = r ? worst(r.fridge?.light, r.freezer?.light) : 'green';
  const activeQuick = QUICK.find((q) => form.offAt === toLocalInput(new Date(now.getTime() - q.hours * HOUR)))?.hours;
  const T = (d: Date) => fmtTime(d, now);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <form className="panel no-print grid gap-5" onSubmit={(e) => e.preventDefault()} aria-labelledby="outage-form-title" noValidate>
        <h2 id="outage-form-title" className="text-xl">
          Your power cut
        </h2>
        {restored && (
          <p className="field-help" role="status">
            We restored the power cut you were tracking on this device.
          </p>
        )}
        <fieldset className="grid gap-2">
          <legend>When did the power go off?</legend>
          <div className="quick-row">
            {QUICK.map((q) => (
              <button key={q.hours} type="button" className="quick-btn" aria-pressed={activeQuick === q.hours} onClick={() => quick(q.hours)}>
                {q.label}
              </button>
            ))}
          </div>
          <label className="field-label mt-2" htmlFor="outage-off">
            Or enter the date and time
          </label>
          <input
            id="outage-off"
            className="input"
            type="datetime-local"
            value={form.offAt}
            max={toLocalInput(now)}
            aria-invalid={errors.offAt ? 'true' : undefined}
            aria-describedby={errors.offAt ? 'outage-off-err' : undefined}
            onChange={(e) => change('offAt', e.target.value)}
          />
          {errors.offAt && (
            <span id="outage-off-err" className="field-error">
              {errors.offAt}
            </span>
          )}
        </fieldset>

        <ChoiceGroup<'yes' | 'no'>
          legend="Do you have a fridge to check?"
          name="has-fridge"
          value={form.hasFridge ? 'yes' : 'no'}
          onChange={(v) => change('hasFridge', v === 'yes')}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]}
        />
        {form.hasFridge && (
          <ChoiceGroup<DoorUse> legend="Fridge door since the cut" name="fridge-door" value={form.fridgeDoor} onChange={(v) => change('fridgeDoor', v)} options={DOOR_OPTIONS} />
        )}
        <ChoiceGroup<FreezerFill>
          legend="How full is the freezer?"
          name="freezer-fill"
          value={form.freezerFill}
          onChange={(v) => change('freezerFill', v)}
          help="A full freezer stays frozen for longer."
          options={[
            { value: 'full', label: 'Full' },
            { value: 'half', label: 'Half full or less' },
            { value: 'none', label: 'No freezer' },
          ]}
        />
        {form.freezerFill !== 'none' && (
          <ChoiceGroup<DoorUse> legend="Freezer door since the cut" name="freezer-door" value={form.freezerDoor} onChange={(v) => change('freezerDoor', v)} options={DOOR_OPTIONS} />
        )}
        {errors.appliances && (
          <p className="field-error" role="alert">
            {errors.appliances}
          </p>
        )}

        <fieldset className="grid gap-2">
          <legend>Is the power back on?</legend>
          <p className="field-help" style={{ marginTop: '-0.2rem' }}>
            Leave this blank while the power is still off.
          </p>
          <div className="quick-row">
            <button type="button" className="quick-btn" onClick={powerBackNow}>
              It’s back now
            </button>
            {form.restoredAt && (
              <button type="button" className="link-btn" onClick={() => change('restoredAt', '')}>
                No, it’s still off
              </button>
            )}
          </div>
          <label className="field-label mt-2" htmlFor="outage-back">
            Power back on at (optional)
          </label>
          <input
            id="outage-back"
            className="input"
            type="datetime-local"
            value={form.restoredAt}
            max={toLocalInput(now)}
            aria-invalid={errors.restoredAt ? 'true' : undefined}
            aria-describedby={errors.restoredAt ? 'outage-back-err' : undefined}
            onChange={(e) => change('restoredAt', e.target.value)}
          />
          {errors.restoredAt && (
            <span id="outage-back-err" className="field-error">
              {errors.restoredAt}
            </span>
          )}
        </fieldset>
        <p className="field-help">The countdown is saved in this browser only, so it survives a reload. Nothing is sent to us.</p>
      </form>

      <section className={`panel results grid gap-6${tracking ? ' results-first' : ''}`} aria-labelledby="outage-results-title" data-light={overall}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="outage-results-title" className="text-xl">
            {r?.powerBack ? 'After the power cut' : 'While the power is off'}
          </h2>
          {r && input && (
            <ToolActions
              textFile={{ name: 'power-cut-food-check.txt', content: () => outageSummaryText(input, r, T), label: 'Download summary (.txt)' }}
              onReset={clear}
              resetLabel="Clear the countdown"
            />
          )}
        </div>

        {!r || !input ? (
          <p className="muted">Fix the highlighted inputs to see the countdown.</p>
        ) : (
          <>
            <div aria-live="polite" aria-atomic="true">
              <p className="big-figure">{formatDuration(r.elapsedMs)}</p>
              <p className="muted mt-1">
                {r.powerBack
                  ? `without power, from ${T(input.offAt)} to ${T(input.restoredAt!)}`
                  : `without power so far, since ${T(input.offAt)}. Updates every 30 seconds.`}
              </p>
              <p className="mt-2">
                <span className="status-tag">{LIGHT_WORD[overall]}</span>
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {r.fridge && (
                <article className="status-card" data-light={r.fridge.light} aria-labelledby="st-fridge">
                  <span className="status-tag">{LIGHT_WORD[r.fridge.light]}</span>
                  <h3 id="st-fridge">Fridge: {fridgeHeadline(r.fridge)}</h3>
                  <Track s={r.fridge} now={now} label="Fridge" />
                  {r.fridge.doorWarning && !r.fridge.passed && (
                    <p className="field-help">The door has been opened, so the fridge may warm up faster than this estimate. Check it with a thermometer.</p>
                  )}
                </article>
              )}
              {r.freezer && (
                <article className="status-card" data-light={r.freezer.light} aria-labelledby="st-freezer">
                  <span className="status-tag">{LIGHT_WORD[r.freezer.light]}</span>
                  <h3 id="st-freezer">
                    {input.freezerFill === 'full' ? 'Full freezer' : 'Half-full freezer'}: {freezerHeadline(r.freezer, input.freezerFill)}
                  </h3>
                  <Track s={r.freezer} now={now} label="Freezer" />
                  {r.freezer.doorWarning && !r.freezer.passed && (
                    <p className="field-help">The door has been opened, so food may thaw sooner than this estimate.</p>
                  )}
                </article>
              )}
            </div>
            <p className="field-help">
              These windows are the Food Standards Agency’s estimates. Your fridge and freezer may warm faster, for example on a hot day. They never mean food is safe: if in doubt, throw it out.
            </p>

            {!r.powerBack && (
              <div>
                <h3 className="mb-2">What to do now</h3>
                <ol className="do-list">
                  <li data-light="green">
                    <b>Now</b>
                    <span>Keep the fridge and freezer doors shut as much as you can.</span>
                  </li>
                  <li data-light="green">
                    <b>Now</b>
                    <span>
                      Report the cut or get updates: call <a href="tel:105">105</a>, free in England, Scotland and Wales. If there is danger to life, call 999.
                    </span>
                  </li>
                  {r.fridge && !r.fridge.passed && (
                    <li data-light={r.fridge.light}>
                      <b>{r.fridge.light === 'green' ? 'Check' : 'Soon'}</b>
                      <span>
                        If you have a fridge thermometer, check it. Chilled food must stay below {FOOD_SAFETY.chilledMaxC}°C. If it reaches {FOOD_SAFETY.chilledMaxC}°C, eat the food that needs the fridge first, within 4 hours, or throw it away.
                      </span>
                    </li>
                  )}
                  {r.fridge && !r.fridge.passed && (
                    <li data-light="green">
                      <b>Option</b>
                      <span>If it is colder than {FOOD_SAFETY.chilledMaxC}°C outside, you can store chilled food outside.</span>
                    </li>
                  )}
                  <li data-light="green">
                    <b>Eat in order</b>
                    <span>
                      Food that needs the fridge first, then defrosted frozen food that needs no cooking, then perishable food kept at room temperature, then tins, jars and dried food.
                    </span>
                  </li>
                  {r.fridge?.passed && (
                    <li data-light="red">
                      <b>Throw away</b>
                      <span>The fridge has been off for more than 4 hours. Throw away food that needs to be kept in the fridge. It may not be safe to eat.</span>
                    </li>
                  )}
                  {r.freezer?.passed && (
                    <li data-light="red">
                      <b>Check all</b>
                      <span>
                        The freezer has passed its {input.freezerFill === 'full' ? 48 : 24}-hour estimate. Check every item. Only food that still has ice crystals, or is at 4°C (40°F) or colder, can be refrozen or cooked. If in doubt, throw it out.
                      </span>
                    </li>
                  )}
                </ol>
              </div>
            )}

            <div>
              <h3 className="mb-2">{r.powerBack ? 'Now the power is back' : 'When the power comes back'}</h3>
              <ul className="grid gap-2" style={{ listStyle: 'disc', paddingLeft: '1.3rem' }}>
                {r.fridge?.restoredInWindow && (
                  <li>
                    The power was off for less than 4 hours. The Food Standards Agency says a cut this short is unlikely to affect the safety of chilled or frozen food.
                  </li>
                )}
                {r.fridge?.passed && <li>The fridge was off for more than 4 hours. Throw away food that needs the fridge, even if it looks and smells fine.</li>}
                <li>Check the fridge gets back to 0 to 5°C and the freezer to about -18°C, their normal settings.</li>
                <li>
                  Frozen food that still has ice crystals, or is at 4°C (40°F) or colder, can be refrozen or cooked. This is US CDC advice; the UK guidance does not give a figure.
                </li>
                <li>Thawed food can be cooked and then frozen again once. You can only reheat it once after that.</li>
                <li>When you cook, make sure food is steaming hot and cooked through.</li>
                <li>
                  <strong>When in doubt, throw it out.</strong>
                </li>
              </ul>
            </div>

            <div className="callout no-print" style={{ marginBlock: 0 }}>
              <Phone size={20} aria-hidden="true" className="icon" />
              <p>
                Read the full <a href="/guides/preparing-for-a-power-cut/">power cut guide</a> for lighting, heating and checking on neighbours. If anyone relies on medical equipment that needs power, join the{' '}
                <a href="https://www.thepsr.co.uk/">Priority Services Register</a>.
              </p>
            </div>
            <p className="field-help">
              <Zap size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> A planning aid based on Food Standards Agency advice. It is not food safety advice for your food: follow official notices and use your judgement.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
