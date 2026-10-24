# Tool specifications (Phase 4 and future)

This file holds the specifications for tools that are registered on the site as **coming soon** but not yet built. Each has an entry in `src/content/tools/<slug>.md` with `status: coming-soon`.

## Important: where these specs come from

The build brief (`stay-prepped-brief.md`, §6) says to keep "the original prompt's input/output specs" for Tools 4–10 here. **The original master prompt was not available to this build**; the brief itself only lists the Phase 4 tools by name, plus one constraint for Tool 9 (below).

So this file contains:

1. **Verbatim from the brief**: the tool names, order, phase and every constraint the brief states. These are authoritative.
2. **Draft specs** (marked _Draft_) written during this build to make the next step easier. They are suggestions only. Replace them with the original prompt's specs if you have them, and review every figure before building: per brief §0 #4, no figures may be invented beyond those the brief specifies, so any draft that needs numbers says where they must come from.

Standards that apply to every tool (brief §7): free; in-browser calculation; validated inputs with inline, specific error messages; results explain assumptions; print stylesheet; download as text/CSV where useful; links to ≥2 related guides; safety disclaimer where relevant; WCAG 2.2 AA; no account; pure calculation functions in `src/lib/calculators/*.ts` with Vitest tests; all state in `localStorage` only.

---

## Brief text (verbatim, §6 Phase 4 and Future)

> **Phase 4 (registry entries only in this build, `status: coming-soon`)**
> Tool 4 72-Hour Emergency Bag Checklist · Tool 5 Emergency Supplies Checklist Generator · Tool 6 Food Storage Rotation Tracker · Tool 7 Preparedness Budget Planner · Tool 8 Power Outage Planner · Tool 9 Family Emergency Plan Generator · Tool 10 Preparedness Progress Tracker. Keep the original prompt's input/output specs for these in `docs/TOOL_SPECS.md` for later.

> **Future (coming-soon entries, lower priority; include at least 8 of these in the registry)**
> Emergency Cooking Calculator · Long-Term Food Storage Planner · Rainwater Collection Calculator · Solar Power Requirements Calculator · Emergency Heating Planner · Household Evacuation Checklist · Vehicle Emergency Kit Checklist · Pet Emergency Preparedness Planner · Emergency Communication Plan Builder · First Aid Kit Checklist · Emergency Document Checklist · Household Risk Assessment · Emergency Cash Reserve Planner · Preparedness Inventory Manager · Home Blackout Readiness Assessment · Winter Preparedness Planner · Flood Preparedness Checklist · Heatwave Preparedness Planner · Emergency Sanitation Calculator.

Other constraints from the brief that apply to these tools:

- §0 #12: "Family Emergency Plan is Phase 4 and must carry an explicit 'stored only on this device' notice."
- §0 #10: Print via `@media print` + browser print; "Download" = plain-text or CSV generated in-browser. No server-side PDF.
- §21: "One new tool a month when capacity allows; quality over quantity."

---

## Phase 4 tools

### Tool 4: 72-Hour Emergency Bag Checklist
- **Slug:** `72-hour-bag-checklist` · **Category:** kits-supplies
- _Draft_ **Inputs:** adults, children (with age bands: under 2, 2–11, 12+), pets (dogs, cats, other), medical needs (yes/no + free-text note), climate/season (warm / cold).
- _Draft_ **Outputs:** a tickable checklist grouped as in `/guides/72-hour-emergency-bag/` (water & food, light & power, health & hygiene, warmth, documents & money), with extra sections added for babies, older relatives and pets. Tick state saved in `localStorage`. Print and download (.txt). Water quantity reuses `calculateWater()` for 3 days.
- **Related guides:** 72-hour-emergency-bag, essential-documents.

### Tool 5: Emergency Supplies Checklist Generator
- **Slug:** `emergency-supplies-checklist` · **Category:** kits-supplies
- _Draft_ **Inputs:** household (as Tool 4), home type (house / flat), heating type (gas / electric / other), local risks chosen from the Be Ready hazard list (flooding, storms, cold weather, heatwave, power cuts, water supply interruption).
- _Draft_ **Outputs:** a home kit checklist based on `/resources/checklists/home-emergency-supplies/`, with extra items per selected risk. Water and food quantities reuse Tools 1 and 2.
- **Related guides:** prepping-for-beginners, preparing-for-a-power-cut.

### Tool 6: Food Storage Rotation Tracker
- **Slug:** `food-rotation-tracker` · **Category:** food-water
- _Draft_ **Inputs:** list of items (name, quantity, unit, best-before or use-by date, location).
- _Draft_ **Outputs:** items sorted by date; "use soon" (within 30 days) and "past date" groups; CSV import/export so people can keep a backup. State in `localStorage` only, with a clear-all button and a notice that clearing browser data deletes it. Must explain best-before vs use-by (see `/guides/how-much-food-to-store/`).
- **Related guides:** how-much-food-to-store.

### Tool 7: Preparedness Budget Planner
- **Slug:** `preparedness-budget-planner` · **Category:** budget
- _Draft_ **Inputs:** weekly or monthly amount the user can spend, target (3 / 7 / 14 days), items already owned (checklist from Tool 5).
- _Draft_ **Outputs:** an ordered buying plan (water → food → light → first aid → other), spread over weeks within the budget. **Prices must be entered by the user**; the site must not invent product prices.
- **Related guides:** prepping-for-beginners.

### Tool 8: Power Outage Planner
- **Slug:** `power-outage-planner` · **Category:** power-energy
- _Draft_ **Inputs:** expected duration (hours / 1 day / 3 days), household, heating type, medical equipment reliant on power (yes/no), devices to keep charged (phone count etc.).
- _Draft_ **Outputs:** a plan covering light, warmth, food, water, communication; power bank capacity estimate only if device battery capacities are user-entered; strong carbon monoxide safety notes; 105 and Priority Services Register prompts.
- **Related guides:** preparing-for-a-power-cut.

### Tool 9: Family Emergency Plan Generator
- **Slug:** `family-emergency-plan` · **Category:** planning-assessments
- **Required (brief §0 #12):** must carry an explicit "stored only on this device" notice. All data in `localStorage`; never sent to a server.
- _Draft_ **Inputs:** household members (name, date of birth optional, medical notes, medicines), contacts (incl. out-of-area contact), two meeting places, who collects whom, pet arrangements, utility shut-off locations, where documents and grab bag are kept.
- _Draft_ **Outputs:** a one-page printable plan following `/guides/family-emergency-plan/` step 8; per-person wallet card; download (.txt). Clear-all button.
- **Related guides:** family-emergency-plan, essential-documents.

### Tool 10: Preparedness Progress Tracker
- **Slug:** `preparedness-progress-tracker` · **Category:** planning-assessments
- _Draft_ **Inputs:** reuses Tool 3's saved results (`stayprepped:preparedness-score:v1`), extended to keep a dated history.
- _Draft_ **Outputs:** score over time, category changes, next steps completed; reminders shown on the page (no notifications or email without explicit opt-in).
- **Related guides:** prepping-for-beginners.

---

## Future tools (registered)

These are in the registry as `phase: 5`. Specs are drafts and every figure must come from a verified source or be clearly labelled as a planning assumption.

| Slug | Title | Category | Draft notes |
| --- | --- | --- | --- |
| `emergency-cooking-calculator` | Emergency Cooking Calculator | food-water | Fuel needed to cook stored food. Needs verified fuel consumption figures, or user-entered stove data. Strong "outdoors only" CO warning for camping stoves. |
| `long-term-food-planner` | Long-Term Food Storage Planner | food-water | Extends Tool 1 beyond 90 days with rotation; reuses `calculateFood()`. |
| `rainwater-collection-calculator` | Rainwater Collection Calculator | food-water | Roof area × rainfall × runoff coefficient. Rainfall must be user-entered or from a cited source. Must state that rainwater is not drinking water without treatment. |
| `solar-power-calculator` | Solar Power Requirements Calculator | power-energy | Device watts × hours; panel/battery sizing with stated efficiency assumptions. |
| `emergency-heating-planner` | Emergency Heating Planner | power-energy | Safe ways to keep warm; CO safety; no indoor use of outdoor heaters. |
| `evacuation-checklist` | Household Evacuation Checklist | planning-assessments | Step-by-step leave-home checklist. |
| `vehicle-kit-checklist` | Vehicle Emergency Kit Checklist | kits-supplies | Car kit for breakdowns and winter. |
| `pet-preparedness-planner` | Pet Emergency Preparedness Planner | household | Pet food/water (reuse water calculator pet figures), medicines, evacuation. |
| `first-aid-kit-checklist` | First Aid Kit Checklist | kits-supplies | Contents list; should cite a first aid organisation's published list. |
| `document-checklist` | Emergency Document Checklist | household | Interactive version of `/resources/checklists/essential-documents/`. |
| `emergency-cash-planner` | Emergency Cash Reserve Planner | budget | User-entered daily spend × days; no invented cost figures. |
| `flood-preparedness-checklist` | Flood Preparedness Checklist | household | Before/during/after; links to GOV.UK flood pages. |
| `winter-preparedness-planner` | Winter Preparedness Planner | household | Home, car and household readiness for cold weather. |

### Future tools not yet registered

Emergency Communication Plan Builder · Household Risk Assessment · Preparedness Inventory Manager · Home Blackout Readiness Assessment · Heatwave Preparedness Planner · Emergency Sanitation Calculator.
