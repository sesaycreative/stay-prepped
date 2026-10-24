# Tool sources (safety-relevant figures)

Every figure the tools below use was checked against the official page listed, by fetching it during the build on **25 October 2026**. Quotes are short and verbatim. If a figure is not in this file, the tool must not use it.

UK sources come first. US sources (CDC, EPA) are used only where the UK sources are silent, and the tool page says so.

---

## Tool A: Power cut food safety (`/tools/power-cut-food-safety/`)

**Food Standards Agency, "Food safety in a power cut: advice for consumers"** (GOV.UK, published 26 July 2023)
https://www.gov.uk/government/publications/food-safety-in-a-power-cut-advice-for-consumers/food-safety-in-a-power-cut-advice-for-consumers

| Used for | Figure (verbatim) |
| --- | --- |
| Fridge window | "Your fridge should stay cold for up to 4 hours." |
| Full freezer window | "up to 48 hours in a full freezer" |
| Half-full freezer window | "(or 24 hours if it's half full)" |
| These are estimates | "but these are estimates." |
| Short outage | "If the power outage is for less than 4 hours this is unlikely to impact the safety of food in chilled or frozen storage." |
| Chilled food threshold | "Chilled foods first need to be kept below 8°C to keep them safe." |
| Above 8 °C | "If the temperature rises to 8°C and above, you should eat food that normally requires refrigeration within 4 hours first." |
| Discard after the window | "these foods should be discarded after 4 hours (unless the power is restored within 4 hours) as they may not be safe to eat." |
| Doors | "Keep fridge and freezer doors closed as much as possible" (section heading) and "Ambient room temperatures may cause your fridge/freezers to increase in temperature if they are opened frequently." |
| Thermometer | "Use a fridge thermometer so you can tell if the fridge has become too warm" (section heading) |
| Store outside | "If the weather is cold (below 8°C), you can store food outside." |
| Eating order | "foods that need refrigeration", then "defrosted frozen food that doesn't need cooking", then "room-temperature perishable food", then "room-temperature canned, bottled, and dried food" |
| Cooking | "take extra care that food is steaming hot and cooked through" |

Food Standards Scotland, "Food safety during a power cut" (https://www.foodstandards.gov.scot/consumers/food-safety/at-home/power-cuts) gives the same 4 / 48 / 24 hour and 8 °C figures.

**FSA, "How to chill, freeze and defrost food safely"** (GOV.UK)
https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely

| Used for | Figure (verbatim) |
| --- | --- |
| Fridge setting | "Your fridge should be set between 0 and 5°C." |
| Freezer setting | "your freezer should be around -18°C" |
| Refreezing cooked food | "you can freeze food again once cooked, but you'll only be able to reheat it once after that" |

**CDC, "Keep Food Safe After a Disaster or Emergency"** (last reviewed 24 November 2025), used where UK pages are silent
https://www.cdc.gov/food-safety/foods/keep-food-safe-after-emergency.html

| Used for | Figure (verbatim) |
| --- | --- |
| Refreezing thawed food (no UK equivalent found) | "You can safely refreeze or cook thawed frozen food that still contains ice crystals or is at 40 °F or below." (40 °F ≈ 4 °C; the tool quotes the original.) |
| If in doubt | "When in doubt, throw it out." |

**Not used (no official source found):** a per-door-opening reduction of the safe window. The FSA says only that frequent opening may raise the temperature. The tool therefore does **not** shorten the countdown for door openings; it warns instead that the window may be shorter and says to check with a thermometer.

---

## Tool B: Water treatment (`/tools/water-treatment-calculator/`)

**Drinking Water Inspectorate, "Receiving a Boil Water Notice"**
https://www.dwi.gov.uk/receiving-a-boil-water-notice/

| Used for | Figure (verbatim) |
| --- | --- |
| Boil | "You should boil your water until it reaches a rolling ball." (DWI gives no boiling time) |
| Cool | "Remove the water from the heat and allow it to cool naturally." |
| Store | "stored in a clean container, in the fridge" and "should be discarded if not used within 24 hours." |
| Uses | "use it to brush your teeth, make ice cubes, prepare food" |
| Notices | "The water company will issue a notice to the consumers in the affected area" |
| Scalds | "Please be cautious that boiling water can cause scalds" |

**CDC, "How to Make Water Safe in an Emergency"** (last reviewed 19 September 2024). No UK household bleach dose was found, so this is the dose source.
https://www.cdc.gov/water-emergency/about/index.html

| Used for | Figure (verbatim) |
| --- | --- |
| Boiling time | "Bring clear water to a rolling boil for 1 minute (at elevations above 6,500 feet, boil for 3 minutes)." |
| Bleach type | "unscented household chlorine bleach" |
| Bleach dose, 5–9% | 1 litre: "2 drops", "0.1 mL"; 1 gallon: "8 drops", "½ mL"; 5 gallons: "40 drops", "2½ mL" |
| Bleach dose, 1% | 1 litre: "10 drops", "½ mL"; 1 gallon: "40 drops", "2½ mL" |
| Cloudy water | filter or let settle first; for cloudy, murky, coloured or very cold water, add double the amount |
| Wait | "at least 30 minutes before you drink it." |
| Tablets | "Follow the instructions on the label or package." |
| Filters | portable filters "do not remove viruses" |
| Contamination | "You **cannot** make water containing fuel, toxic chemicals, or radioactive materials safe by boiling or disinfecting it." |
| Storage | "clean, sanitized containers with tight covers." |

**US EPA, "Emergency Disinfection of Drinking Water"** (last updated 24 February 2026)
https://www.epa.gov/ground-water-and-drinking-water/emergency-disinfection-drinking-water

| Used for | Figure (verbatim) |
| --- | --- |
| Bleach to avoid | "Do not use scented, color safe, or bleaches with added cleaners." |
| 8.25% dose | 1 quart/litre: "2 drops"; 1 gallon: "6 drops" |
| No chlorine smell | "If it doesn't, repeat the dosage and let stand for another 15 minutes before use." |

**CDC, "Cleaning and Sanitizing with Bleach After an Emergency"**
https://stacks.cdc.gov/view/cdc/44192

| Used for | Figure (verbatim) |
| --- | --- |
| Never mix | "Never mix bleach with ammonia or any other cleaner." |

**How the tool turns these into a dose:**
- The tool uses the **per-litre** figures as published. For 5–9% bleach that is 0.1 ml (2 drops) per litre; for 1% it is 0.5 ml (10 drops) per litre; double both for cloudy water.
- 8.25% bleach falls inside CDC's 5–9% band, and EPA's per-litre figure for 8.25% is the same 2 drops, so one "5% to 9%" choice covers both.
- Drops are derived as ml ÷ 0.05 (the brief's stated drop ≈ 0.05 ml assumption). This reproduces CDC's own pairs (2 drops = 0.1 ml; 10 drops = 0.5 ml) and is stated on the page.
- **Bleach of other strengths is not offered.** A strength between 1% and 5% has no published dose, so the tool tells the user not to use it.

**Not used:**
- A typical number of purification tablets per litre: no official figure was found, so the tool says to follow the packet and offers only a timer.
- "Pool chemicals" as a named don't-use item: not in the fetched sources, so the tool uses EPA's wording about bleach with added cleaners instead.

---

## Tool C: Medication supply planner (`/tools/medication-supply-planner/`)

**NHS, "How to order a repeat prescription"**
https://www.nhs.uk/nhs-services/prescriptions/how-to-order-a-repeat-prescription/

| Used for | Figure (verbatim) |
| --- | --- |
| Order lead time | "It's important to request the prescription up to 5 working days before you need your medicine." |

The tool's default "order by" lead time is 7 calendar days, which covers 5 working days plus a weekend. Users can change it. The page explains this.

The UK government's Be Ready campaign (https://beready.campaign.gov.uk/be-ready-for-emergencies/) says the same: "request prescriptions up to 5 working days before you need your medicine."

**NHS, "Emergency prescriptions"**
https://www.nhs.uk/nhs-services/prescriptions/emergency-prescriptions/

| Used for | Figure (verbatim) |
| --- | --- |
| Pharmacies | "Pharmacies can provide certain emergency medicines to patients even if they don't have a prescription" and "you may need to pay." |
| 111 | use the "111 online emergency prescription service" when you've completely run out |

**NHS 111, "Emergency prescriptions"**
https://111.nhs.uk/emergency-prescription

| Used for | Figure (verbatim) |
| --- | --- |
| What it is | "a limited emergency supply of a medicine you've completely run out of" |
| Exclusions | cannot be used for "antibiotics for a new or recent problem" or "controlled drugs that require identification to collect" |
| Symptoms | "If you need medicine and also have any symptoms, call 111 and speak to an adviser instead." |

**Priority Services Register:** links already verified in round 8 (https://www.ofgem.gov.uk/energy-advice-households/getting-extra-help-priority-services-register, https://www.thepsr.co.uk/).

**The traffic light** (green 14+ days, amber 7–13, red under 7) is a planning convention from the brief, not an NHS figure. The page says so.
