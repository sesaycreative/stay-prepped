// Printable checklists for /resources. Plain data so they are easy to edit.
export interface Checklist {
  slug: string;
  title: string;
  description: string;
  intro: string;
  sections: { heading: string; items: string[] }[];
  relatedGuide: { label: string; href: string };
}

export const CHECKLISTS: Checklist[] = [
  {
    slug: 'home-emergency-supplies',
    title: '3-day home emergency supplies checklist',
    description: 'A printable checklist of the basics to keep at home so your household can cope for 3 days without power, water or shops.',
    intro: 'Tick off each item as you gather it. Store everything together and tell everyone in your home where it is.',
    sections: [
      { heading: 'Water and food', items: ['Water for 3 days for everyone, including pets (use the water calculator)', 'Food for 3 days that needs no fridge or cooking', 'Manual tin opener', 'Baby food, formula or special diet foods if needed', 'Pet food'] },
      { heading: 'Light, power and information', items: ['Torch for each adult', 'Spare batteries', 'Battery or wind-up radio', 'Charged power bank and cables', 'Paper list of important phone numbers'] },
      { heading: 'Health and hygiene', items: ['First aid kit', 'Regular medicines (as agreed with your GP or pharmacist)', 'Hand sanitiser and wet wipes', 'Toilet roll and bin bags', 'Sanitary products and nappies if needed'] },
      { heading: 'Warmth', items: ['Blankets or sleeping bags', 'Warm layers, hats and gloves', 'Hot water bottles'] },
      { heading: 'Other', items: ['Cash in small denominations', 'Copies of important documents', 'Spare keys', 'Whistle'] },
    ],
    relatedGuide: { label: 'Prepping for beginners', href: '/guides/prepping-for-beginners/' },
  },
  {
    slug: 'grab-bag',
    title: '72-hour grab bag checklist',
    description: 'A printable packing list for an emergency grab bag you can take if you need to leave home quickly.',
    intro: 'Pack one bag per adult. Keep it light enough to carry for a long walk, and check it every 6 months.',
    sections: [
      { heading: 'Water and food', items: ['Water and a refillable bottle', 'Ready-to-eat food for 3 days', 'Spoon and a small multi-tool'] },
      { heading: 'Light and communication', items: ['Torch or head torch and spare batteries', 'Charged power bank and cables', 'Small radio', 'Whistle'] },
      { heading: 'Health and hygiene', items: ['Small first aid kit', 'Essential medicines and a copy of prescriptions', 'Spare glasses or contact lenses', 'Hand sanitiser, wipes, tissues and toilet roll', 'Toothbrush, toothpaste and sanitary products'] },
      { heading: 'Warmth', items: ['Change of clothes in a waterproof bag', 'Warm layer, hat and gloves', 'Waterproof jacket', 'Foil emergency blanket'] },
      { heading: 'Documents and money', items: ['Copies of key documents in a waterproof wallet', 'Cash in small denominations', 'Paper list of phone numbers', 'Spare house and car keys'] },
    ],
    relatedGuide: { label: 'How to build a 72-hour emergency bag', href: '/guides/72-hour-emergency-bag/' },
  },
  {
    slug: 'power-cut',
    title: 'Power cut checklist',
    description: 'A printable checklist to get ready for a power cut and know what to do when the lights go out.',
    intro: 'Keep this by your torch. The first section is for getting ready; the second is for when the power goes off.',
    sections: [
      { heading: 'Get ready', items: ['Torches and spare batteries in a known place', 'Battery or wind-up radio', 'Charged power bank', '105 saved in your phone and written down', 'Blankets, warm layers and hot water bottles', 'Food that needs no cooking', 'Carbon monoxide alarms fitted and tested', 'Priority Services Register joined, if eligible'] },
      { heading: 'When the power goes off', items: ['Check your fuse box: is it just your home?', 'Call 105 to report it or get updates', 'Switch off cookers, irons and heaters', 'Leave one light switched on', 'Keep the fridge and freezer closed', 'Check on vulnerable neighbours', 'Never use a barbecue, camping stove or generator indoors'] },
    ],
    relatedGuide: { label: 'Preparing for a power cut', href: '/guides/preparing-for-a-power-cut/' },
  },
  {
    slug: 'essential-documents',
    title: 'Essential documents checklist',
    description: 'A printable checklist of the documents to gather, copy and keep safe in case of flood, fire or theft.',
    intro: 'Note where each original is kept and where its copy is. Never write PINs or passwords on this sheet.',
    sections: [
      { heading: 'Identity', items: ['Passports', 'Driving licences', 'Birth, marriage or civil partnership certificates'] },
      { heading: 'Home and money', items: ['Home insurance policy and claims number', 'Mortgage or tenancy agreement', 'Bank and card helpline numbers', 'Pension details', 'Photos of your home and valuables'] },
      { heading: 'Health', items: ['NHS numbers', 'List of conditions, medicines and doses', 'Allergy information', 'Vaccination records'] },
      { heading: 'Family and legal', items: ['Wills and solicitor details', 'Lasting powers of attorney', 'Guardianship arrangements', 'Pet microchip numbers and vet details'] },
      { heading: 'Vehicles', items: ['Car insurance details', 'Vehicle registration certificate (V5C)', 'Breakdown cover number'] },
    ],
    relatedGuide: { label: 'Essential documents to keep ready', href: '/guides/essential-documents/' },
  },
];

/** Official sources. Each URL was checked when added; re-check before relying on them. */
export const OFFICIAL_LINKS = [
  { title: 'Be Ready', url: 'https://beready.campaign.gov.uk/', publisher: 'UK Government', note: 'The UK government campaign on getting ready for emergencies, including a printable checklist.' },
  { title: 'Be informed about hazards', url: 'https://beready.campaign.gov.uk/be-informed-about-hazards/', publisher: 'UK Government', note: 'What to do about specific hazards, from flooding to heatwaves.' },
  { title: 'About Emergency Alerts', url: 'https://www.gov.uk/alerts', publisher: 'GOV.UK', note: 'How the government warns mobile phones about a danger to life nearby.' },
  { title: 'Check for flooding', url: 'https://www.gov.uk/check-flooding', publisher: 'GOV.UK', note: 'Current flood warnings and long-term flood risk for your area.' },
  { title: 'Prepare for flooding', url: 'https://www.gov.uk/prepare-for-flooding', publisher: 'GOV.UK', note: 'How to protect yourself and your home from future flooding.' },
  { title: 'UK weather warnings', url: 'https://weather.metoffice.gov.uk/warnings-and-advice/uk-warnings', publisher: 'Met Office', note: 'Official severe weather warnings.' },
  { title: 'Power Cut 105', url: 'https://www.powercut105.com/', publisher: 'Power Cut 105', note: 'The free number to report a power cut in England, Scotland and Wales.' },
  { title: 'Priority Services Register', url: 'https://www.thepsr.co.uk/', publisher: 'The PSR', note: 'Free extra support from energy and water companies for eligible households.' },
  { title: 'Carbon monoxide poisoning', url: 'https://www.nhs.uk/conditions/carbon-monoxide-poisoning/', publisher: 'NHS', note: 'Symptoms, causes and how to prevent carbon monoxide poisoning.' },
  { title: 'First aid advice', url: 'https://www.sja.org.uk/first-aid-advice/', publisher: 'St John Ambulance', note: 'Step-by-step first aid guidance.' },
];
