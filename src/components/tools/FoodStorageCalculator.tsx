import { useMemo } from 'react';
import {
  calculateFood,
  foodChecklistCsv,
  foodChecklistText,
  foodComparison,
  formatAmount,
  validateFoodInputs,
  type Activity,
  type Diet,
  type FoodInputs,
} from '../../lib/calculators/food';
import { ChoiceGroup, DaysField, EmptyResult, NumberField, ToolActions, fmt, num, usePersistentForm } from './ui';

interface FormState {
  adults: string;
  children: string;
  days: string;
  diet: Diet;
  activity: Activity;
  restrictions: string;
}

const INITIAL: FormState = { adults: '2', children: '0', days: '3', diet: 'any', activity: 'normal', restrictions: '' };
const STORAGE_KEY = 'stayprepped:food-calculator:v1';

function isFormState(v: unknown): v is FormState {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.adults === 'string' &&
    typeof o.children === 'string' &&
    typeof o.days === 'string' &&
    (o.diet === 'any' || o.diet === 'vegetarian' || o.diet === 'vegan') &&
    (o.activity === 'normal' || o.activity === 'high') &&
    typeof o.restrictions === 'string'
  );
}

export default function FoodStorageCalculator() {
  const { state, setState, restored, reset } = usePersistentForm(STORAGE_KEY, INITIAL, isFormState);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setState((s) => ({ ...s, [k]: v }));

  const errors = validateFoodInputs(state);
  const valid = Object.keys(errors).length === 0;

  const input: FoodInputs | null = valid
    ? {
        adults: num(state.adults),
        children: num(state.children),
        days: num(state.days),
        diet: state.diet,
        activity: state.activity,
        restrictions: state.restrictions,
      }
    : null;

  const result = useMemo(() => (input ? calculateFood(input) : null), [JSON.stringify(input)]);
  const comparison = useMemo(
    () => (input ? foodComparison({ adults: input.adults, children: input.children, diet: input.diet, activity: input.activity }) : []),
    [JSON.stringify(input)],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <form className="panel no-print grid gap-5" onSubmit={(e) => e.preventDefault()} aria-labelledby="food-form-title" noValidate>
        <h2 id="food-form-title" className="text-xl">
          Your household
        </h2>
        {restored && (
          <p className="field-help" role="status">
            We restored the inputs you used last time on this device.
          </p>
        )}
        <NumberField label="Adults" help="Everyone aged 12 and over." value={state.adults} onChange={(v) => set('adults', v)} error={errors.adults} max={50} />
        <NumberField label="Children under 12" value={state.children} onChange={(v) => set('children', v)} error={errors.children} max={50} />
        {errors.people && (
          <p className="field-error" role="alert">
            {errors.people}
          </p>
        )}
        <DaysField value={state.days} onChange={(v) => set('days', v)} error={errors.days} />
        <ChoiceGroup<Diet>
          legend="Dietary preference"
          name="diet"
          value={state.diet}
          onChange={(v) => set('diet', v)}
          options={[
            { value: 'any', label: 'Any' },
            { value: 'vegetarian', label: 'Vegetarian' },
            { value: 'vegan', label: 'Vegan' },
          ]}
        />
        <ChoiceGroup<Activity>
          legend="Activity level"
          name="activity"
          value={state.activity}
          onChange={(v) => set('activity', v)}
          help="Choose high if you expect heavy physical work, such as clearing up after a flood."
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'high', label: 'High' },
          ]}
        />
        <div className="field">
          <label className="field-label" htmlFor="food-restrictions">
            Allergies or restrictions (optional)
          </label>
          <span id="food-restrictions-help" className="field-help">
            A note for your checklist only. It does not change the numbers, so check every item yourself.
          </span>
          <textarea
            id="food-restrictions"
            className="textarea"
            maxLength={300}
            aria-describedby="food-restrictions-help"
            value={state.restrictions}
            onChange={(e) => set('restrictions', e.target.value)}
          />
        </div>
        <p className="field-help">Your inputs are saved in this browser only. Nothing is sent to us.</p>
      </form>

      <section className="panel results grid gap-6" aria-labelledby="food-results-title">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="food-results-title" className="text-xl">
            Your food plan
          </h2>
          {result && input && (
            <ToolActions
              textFile={{ name: `food-checklist-${input.days}-days.txt`, content: () => foodChecklistText(input, result) }}
              csvFile={{ name: `food-plan-${input.days}-days.csv`, content: () => foodChecklistCsv(result) }}
              onReset={reset}
            />
          )}
        </div>

        <div aria-live="polite" aria-atomic="true">
          {result && input ? (
            <p>
              For {input.adults} {input.adults === 1 ? 'adult' : 'adults'}
              {input.children > 0 && ` and ${input.children} ${input.children === 1 ? 'child' : 'children'}`} over {input.days}{' '}
              {input.days === 1 ? 'day' : 'days'}, plan for about <strong>{fmt(result.totalKcal)} kcal</strong>.
            </p>
          ) : (
            <EmptyResult>Fix the highlighted inputs to see your plan.</EmptyResult>
          )}
        </div>

        {result && input && (
          <>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="stat">
                <dt className="stat-label">Calories per day</dt>
                <dd className="stat-value">{fmt(result.kcalPerDay)}</dd>
              </div>
              <div className="stat">
                <dt className="stat-label">Food by weight</dt>
                <dd className="stat-value">{fmt(result.totalKg, 1)} kg</dd>
              </div>
              <div className="stat">
                <dt className="stat-label">Oil and milk</dt>
                <dd className="stat-value">{fmt(result.totalLitres, 1)} L</dd>
              </div>
            </dl>

            <div>
              <h3 className="mb-2">Shopping checklist</h3>
              {input.restrictions?.trim() && (
                <p className="callout callout-warning">
                  <span>
                    <span className="callout-title">Your note</span>
                    {input.restrictions?.trim()}
                  </span>
                </p>
              )}
              <div className="grid gap-5">
                {result.groups.map((g) => (
                  <div key={g.id}>
                    <h4>
                      {g.label} <span className="muted font-normal">({Math.round(g.share * 100)}% of calories)</span>
                    </h4>
                    <ul className="mt-1">
                      {g.lines.map((l) => (
                        <li key={l.item} className="check-item">
                          <input type="checkbox" aria-label={`${l.item}, about ${formatAmount(l.amount, l.unit)}`} />
                          <span>
                            <strong>{l.item}</strong>: about {formatAmount(l.amount, l.unit)}{' '}
                            <span className="muted">({fmt(l.kcal)} kcal)</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="field-help mt-1">Ideas: {g.examples.join(', ')}.</p>
                    <p className="field-help">Storage: {g.storageTip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2">The same household over longer periods</h3>
              <div className="table-scroll">
                <table className="data-table">
                  <caption className="sr-only">Food needed for 3, 7, 14, 30 and 90 days</caption>
                  <thead>
                    <tr>
                      <th scope="col">Days</th>
                      <th scope="col" className="num">
                        Calories
                      </th>
                      <th scope="col" className="num">
                        Food (kg)
                      </th>
                      <th scope="col" className="num">
                        Oil and milk (litres)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((r) => (
                      <tr key={r.days} aria-current={r.days === input.days ? 'true' : undefined} style={r.days === input.days ? { fontWeight: 700 } : undefined}>
                        <th scope="row">{r.days}</th>
                        <td className="num">{fmt(r.totalKcal)}</td>
                        <td className="num">{fmt(r.totalKg, 1)}</td>
                        <td className="num">{fmt(r.totalLitres, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
