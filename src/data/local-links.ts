// Outbound links on /local-risk/. Every URL below was fetched and checked on
// 24 October 2026 (title noted beside it). Do not add one without checking it.
// None of these is called from the site or pre-filled with a postcode: the
// visitor opens them and types their own postcode.

export interface LocalLink {
  label: string;
  url: string;
  /** The page's own title when checked. */
  title: string;
}

export interface LocalCard {
  id: string;
  icon: string;
  tone: string;
  heading: string;
  tells: string;
  /** Links shown on the card. For flood risk the order depends on the nation hint. */
  links: LocalLink[];
  note?: string;
}

export const FLOOD_RISK: Record<'england' | 'scotland' | 'wales' | 'ni', LocalLink> = {
  england: { label: 'England: check long-term flood risk', url: 'https://www.gov.uk/check-long-term-flood-risk', title: 'Check the long term flood risk for an area in England - GOV.UK' },
  scotland: { label: 'Scotland: SEPA flood maps', url: 'https://beta.sepa.scot/flooding/flood-maps/', title: 'Flood maps | SEPA' },
  wales: { label: 'Wales: check your flood risk by postcode', url: 'https://naturalresources.wales/flooding/check-your-flood-risk-by-postcode/?lang=en', title: 'Natural Resources Wales / Check your flood risk by postcode' },
  ni: { label: 'Northern Ireland: check the risk of flooding', url: 'https://www.nidirect.gov.uk/articles/check-risk-flooding-your-area', title: 'Check the risk of flooding in your area | nidirect' },
};

export const CARDS: LocalCard[] = [
  {
    id: 'flood-warnings',
    icon: 'bell-ring',
    tone: 'water',
    heading: 'Flood warnings by text, phone or email',
    tells: 'Free alerts when rivers, the sea or groundwater may flood where you live.',
    links: [
      { label: 'England: get flood warnings', url: 'https://www.gov.uk/sign-up-for-flood-warnings', title: 'Get flood warnings by text, phone or email - GOV.UK' },
      { label: 'Scotland: sign up to Floodline', url: 'https://myfloodline.sepa.scot/register', title: 'Sign up to Floodline | Floodline' },
      { label: 'Wales: sign up to receive flood warnings', url: 'https://naturalresources.wales/flooding/sign-up-to-receive-flood-warnings/?lang=en', title: 'Sign up to receive flood warnings | Natural Resources Wales' },
    ],
  },
  {
    id: 'network-operator',
    icon: 'zap',
    tone: 'power',
    heading: 'Who runs your electricity network',
    tells: 'Your network operator, not your supplier, fixes power cuts. Call 105 free in England, Scotland and Wales; in Northern Ireland call 03457 643643.',
    links: [
      { label: 'Find my network operator', url: 'https://www.energynetworks.org/customers/find-my-network-operator', title: 'Energy Networks Association: find your electricity network operator by postcode (checked 24 Oct 2026)' },
      { label: 'About 105', url: 'https://www.powercut105.com/', title: 'About 105' },
    ],
  },
  {
    id: 'water-company',
    icon: 'droplet',
    tone: 'water',
    heading: 'Who supplies your water',
    tells: 'The company to call if your water goes off or you are told it may be unsafe.',
    links: [{ label: 'Find your water supplier', url: 'https://www.water.org.uk/customers/find-your-supplier', title: 'Find Your Supplier | Water UK' }],
  },
  {
    id: 'psr',
    icon: 'heart-handshake',
    tone: 'health',
    heading: 'Priority Services Register',
    tells: 'Free extra help from your energy and water companies if anyone at home needs it.',
    links: [
      { label: 'Ofgem: join your supplier’s register', url: 'https://www.ofgem.gov.uk/energy-advice-households/getting-extra-help-priority-services-register', title: "Join your supplier's Priority Services Register | Ofgem" },
      { label: 'The Priority Services Register', url: 'https://www.thepsr.co.uk/', title: 'The Priority Services Register (PSR)' },
    ],
  },
  {
    id: 'council',
    icon: 'landmark',
    tone: 'gov',
    heading: 'Your local council',
    tells: 'Councils plan for local emergencies and publish advice, including where to go if you have to leave home.',
    links: [{ label: 'Find your local council', url: 'https://www.gov.uk/find-local-council', title: 'Find your local council - GOV.UK' }],
  },
  {
    id: 'weather',
    icon: 'cloud-lightning',
    tone: 'skills',
    heading: 'Weather warnings',
    tells: 'Official yellow, amber and red warnings for storms, rain, snow, ice and heat.',
    links: [{ label: 'Met Office UK weather warnings', url: 'https://weather.metoffice.gov.uk/warnings-and-advice/uk-warnings', title: 'UK weather warnings - Met Office' }],
  },
];
