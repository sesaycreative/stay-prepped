import { useEffect, useRef, useState } from 'react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import {
  MEDICATION,
  dayStart,
  isoDay,
  medicationListText,
  planSupply,
  validateLeadDays,
  validateRow,
  type Light,
  type MedicineResult,
  type MedicineRow,
} from '../../lib/calculators/medication';
import { ToolActions, fmt } from './ui';

interface RowForm {
  id: string;
  name: string;
  perDay: string;
  perPack: string;
  packs: string;
  loose: string;
  nextRepeat: string;
  countedOn: string;
}

const newId = () => Math.random().toString(36).slice(2, 10);
const blankRow = (today: string): RowForm => ({ id: newId(), name: '', perDay: '1', perPack: '28', packs: '', loose: '', nextRepeat: '', countedOn: today });
const fmtDay = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const LIGHT_WORD: Record<Light, string> = { green: '14 days or more', amber: '7 to 13 days', red: 'Under 7 days' };

function toRow(f: RowForm): MedicineRow | null {
  if (Object.keys(validateRow(f)).length) return null;
  return {
    id: f.id,
    name: f.name.trim(),
    perDay: Number(f.perDay),
    perPack: Number(f.perPack),
    packs: Number(f.packs),
    loose: f.loose === '' ? 0 : Number(f.loose),
    countedOn: f.countedOn,
    ...(f.nextRepeat ? { nextRepeat: f.nextRepeat } : {}),
  };
}

function Field(props: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; inputMode?: 'numeric' | 'decimal'; className?: string; help?: string }) {
  return (
    <div className={`field ${props.className ?? ''}`}>
      <label className="field-label" htmlFor={props.id}>
        {props.label}
      </label>
      <input
        id={props.id}
        className="input"
        type={props.type ?? 'text'}
        inputMode={props.inputMode}
        min={props.type === 'number' ? 0 : undefined}
        step={props.inputMode === 'decimal' ? 'any' : undefined}
        autoComplete="off"
        maxLength={props.type ? undefined : 60}
        value={props.value}
        aria-invalid={props.error ? 'true' : undefined}
        aria-describedby={[props.help ? `${props.id}-help` : '', props.error ? `${props.id}-err` : ''].filter(Boolean).join(' ') || undefined}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {props.help && (
        <span id={`${props.id}-help`} className="field-help">
          {props.help}
        </span>
      )}
      {props.error && (
        <span id={`${props.id}-err`} className="field-error">
          {props.error}
        </span>
      )}
    </div>
  );
}

export default function MedicationSupplyPlanner() {
  const [today, setToday] = useState<Date | null>(null);
  const [rows, setRows] = useState<RowForm[]>([]);
  const [lead, setLead] = useState(String(MEDICATION.defaultLeadDays));
  const [restored, setRestored] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const pg = useRef<typeof import('../../lib/progress') | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    const t = new Date();
    setToday(t);
    const iso = isoDay(dayStart(t));
    void import('../../lib/progress').then((m) => {
      pg.current = m;
      const saved = m.progress().get().medicines;
      if (saved && saved.rows.length) {
        setRows(
          saved.rows.map((r) => ({
            id: r.id,
            name: r.name,
            perDay: String(r.perDay),
            perPack: String(r.perPack),
            packs: String(r.packs),
            loose: r.loose ? String(r.loose) : '',
            nextRepeat: r.nextRepeat ?? '',
            countedOn: r.countedOn,
          })),
        );
        setLead(String(saved.leadDays));
        setRestored(true);
        setTouched(Object.fromEntries(saved.rows.map((r) => [r.id, true])));
      } else {
        setRows([blankRow(iso)]);
      }
      loaded.current = true;
    });
  }, []);

  const leadError = validateLeadDays(lead);
  const leadDays = leadError ? MEDICATION.defaultLeadDays : Number(lead);
  const validRows = rows.map(toRow).filter((r): r is MedicineRow => r !== null);
  const plan = today && validRows.length ? planSupply(validRows, today, leadDays) : null;
  const byId = new Map<string, MedicineResult>(plan?.results.map((r) => [r.id, r]) ?? []);

  // Save valid rows to the shared progress store (this device only).
  useEffect(() => {
    if (!loaded.current || !pg.current) return;
    pg.current.progress().setMedicines(validRows.length ? { rows: validRows, leadDays } : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(validRows), leadDays]);

  const todayIso = today ? isoDay(dayStart(today)) : '';
  const update = (id: string, k: keyof RowForm, v: string) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, [k]: v };
        // A new count of what is on hand is dated today.
        if (k === 'packs' || k === 'loose' || k === 'perPack') next.countedOn = todayIso;
        return next;
      }),
    );
  const blur = (id: string) => setTouched((t) => ({ ...t, [id]: true }));
  const add = () => setRows((rs) => (rs.length >= MEDICATION.maxRows ? rs : [...rs, blankRow(todayIso)]));
  const remove = (id: string) => setRows((rs) => (rs.length === 1 ? [blankRow(todayIso)] : rs.filter((r) => r.id !== id)));
  const clearAll = () => {
    pg.current?.progress().setMedicines(undefined);
    setRows([blankRow(todayIso)]);
    setLead(String(MEDICATION.defaultLeadDays));
    setTouched({});
    setRestored(false);
  };

  if (!today) {
    return (
      <div className="panel">
        <p className="muted">Loading your list…</p>
      </div>
    );
  }

  const soonest = plan?.soonest;

  return (
    <div className="grid gap-6">
      <section className="panel no-print grid gap-5" aria-labelledby="med-form-title">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="med-form-title" className="text-xl">
            Your medicines
          </h2>
          <p className="field-help" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
              <ShieldCheck size={16} aria-hidden="true" style={{ flexShrink: 0 }} /> Stored on this device only. Nothing is sent to us.
            </span>
            <button type="button" className="link-btn" onClick={clearAll}>
              Clear my list
            </button>
          </p>
        </div>
        {restored && (
          <p className="field-help" role="status">
            We restored your list from this device. Days left count down from the day you last entered the amounts.
          </p>
        )}
        <div className="med-rows">
          {rows.map((r, i) => {
            const e = validateRow(r);
            const show = touched[r.id] ? e : {};
            const res = byId.get(r.id);
            return (
              <div key={r.id} className="med-row" role="group" aria-labelledby={`m-${r.id}-h`} onBlur={() => blur(r.id)}>
                <div className="med-head">
                  <h3 id={`m-${r.id}-h`} style={{ margin: 0, fontSize: '1.02rem' }}>
                    Medicine {i + 1}
                    {r.name.trim() ? `: ${r.name.trim()}` : ''}
                  </h3>
                  <button type="button" className="link-btn" onClick={() => remove(r.id)} aria-label={`Remove medicine ${i + 1}${r.name.trim() ? `, ${r.name.trim()}` : ''}`}>
                    <Trash2 size={16} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-3px' }} /> Remove
                  </button>
                </div>
                <div className="med-row-fields">
                  <Field id={`m-${r.id}-name`} className="span-2" label="Name" value={r.name} onChange={(v) => update(r.id, 'name', v)} error={show.name} />
                  <Field id={`m-${r.id}-day`} label="Taken a day" type="number" inputMode="decimal" value={r.perDay} onChange={(v) => update(r.id, 'perDay', v)} error={show.perDay} />
                  <Field id={`m-${r.id}-pack`} label="In a pack" type="number" inputMode="numeric" value={r.perPack} onChange={(v) => update(r.id, 'perPack', v)} error={show.perPack} />
                  <Field id={`m-${r.id}-packs`} label="Full packs" type="number" inputMode="numeric" value={r.packs} onChange={(v) => update(r.id, 'packs', v)} error={show.packs} />
                  <Field id={`m-${r.id}-loose`} label="Loose" type="number" inputMode="decimal" value={r.loose} onChange={(v) => update(r.id, 'loose', v)} error={show.loose} help="Optional" />
                  <Field id={`m-${r.id}-next`} className="span-2" label="Next repeat due" type="date" value={r.nextRepeat} onChange={(v) => update(r.id, 'nextRepeat', v)} error={show.nextRepeat} help="Optional" />
                </div>
                {res && (
                  <p className="field-help" data-light={res.light} style={{ color: 'var(--st-ink)', fontWeight: 700 }}>
                    {res.daysLeft} {res.daysLeft === 1 ? 'day' : 'days'} left · runs out {fmtDay(res.runsOutOn)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <button type="button" className="btn btn-ghost" onClick={add} disabled={rows.length >= MEDICATION.maxRows}>
            <Plus size={18} aria-hidden="true" /> Add another medicine
          </button>
          {rows.length >= MEDICATION.maxRows && <span className="field-help">You can list up to {MEDICATION.maxRows} medicines.</span>}
          <div className="field" style={{ marginLeft: 'auto' }}>
            <label className="field-label" htmlFor="med-lead">
              Order this many days before you run out
            </label>
            <span id="med-lead-help" className="field-help">
              The NHS asks for up to 5 working days. 7 days allows for a weekend.
            </span>
            <div className="flex items-center gap-2">
              <input
                id="med-lead"
                className="input"
                style={{ maxWidth: '6rem' }}
                type="number"
                inputMode="numeric"
                min={MEDICATION.minLeadDays}
                max={MEDICATION.maxLeadDays}
                value={lead}
                aria-invalid={leadError ? 'true' : undefined}
                aria-describedby={`med-lead-help${leadError ? ' med-lead-err' : ''}`}
                onChange={(e) => setLead(e.target.value)}
              />
              <span className="muted">days</span>
            </div>
            {leadError && (
              <span id="med-lead-err" className="field-error">
                {leadError}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="panel results grid gap-5" aria-labelledby="med-results-title">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="med-results-title" className="text-xl">
            When to order
          </h2>
          {plan && <ToolActions textFile={{ name: 'my-medicines.txt', content: () => medicationListText(plan.results, fmtDay, leadDays), label: 'Download list (.txt)' }} />}
        </div>

        {!plan ? (
          <p className="muted">Add a medicine with how many you take a day, how many come in a pack and how many full packs you have.</p>
        ) : (
          <>
            {soonest && (
              <div className="status-card" data-light={soonest.light} aria-live="polite" aria-atomic="true">
                <span className="status-tag">{soonest.orderNow ? 'Order now' : LIGHT_WORD[soonest.light]}</span>
                <h3>
                  {soonest.orderNow
                    ? `Order ${soonest.name} now. It runs out ${fmtDay(soonest.runsOutOn)}.`
                    : `Next to order: ${soonest.name}, by ${fmtDay(soonest.orderBy)}.`}
                </h3>
                <p className="field-help" style={{ color: 'inherit' }}>
                  {soonest.daysLeft} {soonest.daysLeft === 1 ? 'day' : 'days'} left. Set a reminder in your phone or calendar for the order-by date.
                </p>
              </div>
            )}
            <div className="table-scroll">
              <table className="data-table stack-table">
                <caption className="sr-only">Days of supply left and order-by date for each medicine</caption>
                <thead>
                  <tr>
                    <th scope="col">Medicine</th>
                    <th scope="col" className="num">
                      Days left
                    </th>
                    <th scope="col">Runs out</th>
                    <th scope="col">Order by</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.results.map((r) => (
                    <tr key={r.id} data-light={r.light}>
                      <th scope="row">
                        {r.name}
                        {r.repeatTooLate && r.nextRepeat && (
                          <span className="field-help" style={{ display: 'block', color: 'var(--st-stop-ink)' }}>
                            Your next repeat ({fmtDay(r.nextRepeat)}) is after you run out.
                          </span>
                        )}
                      </th>
                      <td className="num" data-label="Days left">{fmt(r.daysLeft)}</td>
                      <td data-label="Runs out">{fmtDay(r.runsOutOn)}</td>
                      <td data-label="Order by">{r.orderNow ? <strong>Now</strong> : fmtDay(r.orderBy)}</td>
                      <td data-label="Status">
                        <span className="status-tag">{LIGHT_WORD[r.light]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="field-help">
              Green is 14 days or more, amber 7 to 13 days, red under 7 days. These bands are our planning convention, not an NHS rule. Days left are whole days at the amount you take now.
              {plan.anyRed ? '' : ' Your First aid area on My progress counts as ready while nothing is red.'}
            </p>
          </>
        )}

        <div className="callout" style={{ marginBlock: 0 }}>
          <div>
            <span className="callout-title">During an emergency</span>
            <ul className="grid gap-2" style={{ listStyle: 'disc', paddingLeft: '1.2rem' }}>
              <li>Keep a written list of your medicines, doses and pharmacy in your grab bag. Print this page or download the list.</li>
              <li>
                If you completely run out, use the <a href="https://111.nhs.uk/emergency-prescription">NHS 111 online emergency prescription service</a>, or ask a pharmacy. Pharmacies can provide some emergency medicines without a prescription, but you may need to pay. It does not cover antibiotics for a new problem or controlled drugs that need ID.
              </li>
              <li>If you need medicine and also feel unwell, call 111 instead. In an emergency, call 999.</li>
              <li>
                If anyone has a long-term health condition or relies on powered medical equipment, see if they can join the free <a href="https://www.thepsr.co.uk/">Priority Services Register</a> for extra help in a power cut.
              </li>
              <li>
                Add medicines to your <a href="/guides/family-emergency-plan/">family emergency plan</a>.
              </li>
            </ul>
          </div>
        </div>
        <p className="field-help">
          A planning aid only. It is not medical advice and does not change how you take any medicine. Ask your GP or pharmacist about your medicines. Read more on{' '}
          <a href="https://www.nhs.uk/nhs-services/prescriptions/emergency-prescriptions/">NHS emergency prescriptions</a>.
        </p>
      </section>
    </div>
  );
}
