import { useMemo } from 'react';
import { calculateWater, validateWaterInputs, waterCsv, waterSummaryText, type Climate, type WaterInputs } from '../../lib/calculators/water';
import { ChoiceGroup, DaysField, EmptyResult, NumberField, ToolActions, fmt, num, useHouseholdSeed, useMarkToolUsed, usePersistentForm } from './ui';

interface FormState {
  adults: string;
  children: string;
  days: string;
  climate: Climate;
  extraHygiene: 'yes' | 'no';
  pregnantOrNursing: string;
  dogsSmall: string;
  dogsMedium: string;
  dogsLarge: string;
  cats: string;
}

const INITIAL: FormState = {
  adults: '2',
  children: '0',
  days: '3',
  climate: 'temperate',
  extraHygiene: 'no',
  pregnantOrNursing: '0',
  dogsSmall: '0',
  dogsMedium: '0',
  dogsLarge: '0',
  cats: '0',
};
const STORAGE_KEY = 'stayprepped:water-calculator:v1';

function isFormState(v: unknown): v is FormState {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  const strs = ['adults', 'children', 'days', 'pregnantOrNursing', 'dogsSmall', 'dogsMedium', 'dogsLarge', 'cats'];
  return (
    strs.every((k) => typeof o[k] === 'string') &&
    (o.climate === 'temperate' || o.climate === 'hot') &&
    (o.extraHygiene === 'yes' || o.extraHygiene === 'no')
  );
}

export default function WaterStorageCalculator() {
  const { state, setState, restored, reset } = usePersistentForm(STORAGE_KEY, INITIAL, isFormState);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setState((s) => ({ ...s, [k]: v }));

  const errors = validateWaterInputs(state);
  const valid = Object.keys(errors).length === 0;
  const input: WaterInputs | null = valid
    ? {
        adults: num(state.adults),
        children: num(state.children),
        days: num(state.days),
        climate: state.climate,
        extraHygiene: state.extraHygiene === 'yes',
        pregnantOrNursing: num(state.pregnantOrNursing),
        dogsSmall: num(state.dogsSmall),
        dogsMedium: num(state.dogsMedium),
        dogsLarge: num(state.dogsLarge),
        cats: num(state.cats),
      }
    : null;
  const r = useMemo(() => (input ? calculateWater(input) : null), [JSON.stringify(input)]);
  const seeded = useHouseholdSeed(setState, STORAGE_KEY);
  const personal = restored || seeded || JSON.stringify(state) !== JSON.stringify(INITIAL);
  useMarkToolUsed('water', !!r, personal);

  const L = (n: number) => `${fmt(n, n < 100 && n % 1 !== 0 ? 1 : 0)} L`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <form className="panel no-print grid gap-5" onSubmit={(e) => e.preventDefault()} aria-labelledby="water-form-title" noValidate>
        <h2 id="water-form-title" className="text-xl">
          Your household
        </h2>
        {restored && (
          <p className="field-help" role="status">
            We restored the inputs you used last time on this device.
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Adults" value={state.adults} onChange={(v) => set('adults', v)} error={errors.adults} max={50} />
          <NumberField label="Children" value={state.children} onChange={(v) => set('children', v)} error={errors.children} max={50} />
        </div>
        {errors.people && (
          <p className="field-error" role="alert">
            {errors.people}
          </p>
        )}
        <NumberField
          label="Pregnant or breastfeeding"
          help="How many of the people above. Adds 1 litre a day each."
          value={state.pregnantOrNursing}
          onChange={(v) => set('pregnantOrNursing', v)}
          error={errors.pregnantOrNursing}
          max={50}
        />
        <DaysField value={state.days} onChange={(v) => set('days', v)} error={errors.days} />
        <ChoiceGroup<Climate>
          legend="Climate"
          name="climate"
          value={state.climate}
          onChange={(v) => set('climate', v)}
          help="Choose hot for heatwaves or warm climates. Adds 1 litre per person per day."
          options={[
            { value: 'temperate', label: 'Temperate' },
            { value: 'hot', label: 'Hot' },
          ]}
        />
        <ChoiceGroup<'yes' | 'no'>
          legend="Extra for hygiene"
          name="hygiene"
          value={state.extraHygiene}
          onChange={(v) => set('extraHygiene', v)}
          help="More washing and cleaning, for example with young children or illness. Adds 2 litres per person per day."
          options={[
            { value: 'no', label: 'No' },
            { value: 'yes', label: 'Yes' },
          ]}
        />
        <fieldset className="grid gap-3">
          <legend>Pets</legend>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Small dogs" value={state.dogsSmall} onChange={(v) => set('dogsSmall', v)} error={errors.dogsSmall} max={20} />
            <NumberField label="Medium dogs" value={state.dogsMedium} onChange={(v) => set('dogsMedium', v)} error={errors.dogsMedium} max={20} />
            <NumberField label="Large dogs" value={state.dogsLarge} onChange={(v) => set('dogsLarge', v)} error={errors.dogsLarge} max={20} />
            <NumberField label="Cats" value={state.cats} onChange={(v) => set('cats', v)} error={errors.cats} max={20} />
          </div>
        </fieldset>
        <p className="field-help">Your inputs are saved in this browser only. Nothing is sent to us.</p>
      </form>

      <section className="panel results grid gap-6" aria-labelledby="water-results-title">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="water-results-title" className="text-xl">
            Your water plan
          </h2>
          {r && input && (
            <ToolActions
              textFile={{ name: `water-plan-${input.days}-days.txt`, content: () => waterSummaryText(input, r) }}
              csvFile={{ name: `water-plan-${input.days}-days.csv`, content: () => waterCsv(r) }}
              onReset={reset}
            />
          )}
        </div>

        <div aria-live="polite" aria-atomic="true">
          {r && input ? (
            <p>
              Store about <strong>{L(r.total.total)}</strong> for {input.days} {input.days === 1 ? 'day' : 'days'}. That is{' '}
              {L(r.daily.total)} a day.
            </p>
          ) : (
            <EmptyResult>Fix the highlighted inputs to see your plan.</EmptyResult>
          )}
        </div>

        {r && input && (
          <>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="stat">
                <dt className="stat-label">Total in litres</dt>
                <dd className="stat-value">{fmt(r.total.total, 1)} L</dd>
              </div>
              <div className="stat">
                <dt className="stat-label">UK (imperial) gallons</dt>
                <dd className="stat-value">{fmt(r.ukGallons, 1)}</dd>
              </div>
              <div className="stat">
                <dt className="stat-label">US gallons</dt>
                <dd className="stat-value">{fmt(r.usGallons, 1)}</dd>
              </div>
            </dl>

            <div>
              <h3 className="mb-2">Where the water goes</h3>
              <div className="table-scroll">
                <table className="data-table">
                  <caption className="sr-only">Water split by use, per day and in total</caption>
                  <thead>
                    <tr>
                      <th scope="col">Use</th>
                      <th scope="col" className="num">
                        Per day
                      </th>
                      <th scope="col" className="num">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Drinking</th>
                      <td className="num">{L(r.daily.drinking)}</td>
                      <td className="num">{L(r.total.drinking)}</td>
                    </tr>
                    <tr>
                      <th scope="row">Cooking and hygiene</th>
                      <td className="num">{L(r.daily.cookingHygiene)}</td>
                      <td className="num">{L(r.total.cookingHygiene)}</td>
                    </tr>
                    {r.pets > 0 && (
                      <tr>
                        <th scope="row">Pets</th>
                        <td className="num">{L(r.daily.pets)}</td>
                        <td className="num">{L(r.total.pets)}</td>
                      </tr>
                    )}
                    <tr style={{ fontWeight: 700 }}>
                      <th scope="row">Total</th>
                      <td className="num">{L(r.daily.total)}</td>
                      <td className="num">{L(r.total.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="mb-2">Containers you would need</h3>
              <p className="field-help mb-2">Choose one size or mix them. Counts are rounded up.</p>
              <ul>
                {r.containers.map((c) => (
                  <li key={c.size} className="check-item">
                    <input type="checkbox" aria-label={`${c.count} containers of ${c.size} litres`} />
                    <span>
                      <strong>{c.count}</strong> × {c.size} litre {c.count === 1 ? 'container' : 'containers'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2">Keeping it fresh</h3>
              <ul className="grid gap-2" style={{ listStyle: 'disc', paddingLeft: '1.3rem' }}>
                <li>Shop-bought bottled water: replace by the date printed on the bottle.</li>
                <li>Water you have filled yourself from the tap: replace every 6 months.</li>
                <li>Store containers somewhere cool and dark, away from chemicals and fuel.</li>
                <li>
                  If you are unsure whether water is safe, treat it first. See{' '}
                  <a href="/guides/emergency-water-purification/">emergency water purification</a>.
                </li>
              </ul>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
