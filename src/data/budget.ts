/** National Treasury, Medium Term Budget Policy Statement, 21 October 2026.
 *  Amounts are R billion unless noted. Lines are published figures and can
 *  differ from a child-sum by R0.1 billion because Treasury rounds.
 */

export const YEARS = [
  { id: "2025/26", label: "2025/26", status: "Outcome" },
  { id: "2026/27", label: "2026/27", status: "Revised" },
  { id: "2027/28", label: "2027/28", status: "Estimate" },
  { id: "2028/29", label: "2028/29", status: "Estimate" },
  { id: "2029/30", label: "2029/30", status: "Estimate" },
] as const;

export type YearId = (typeof YEARS)[number]["id"];

export type Series = [number, number, number, number, number];

export type SpendNode = {
  id: string;
  name: string;
  /** Average annual growth, 2026/27–2029/30, where Treasury published one. */
  growth: number | null;
  values: Series;
  blurb: string;
  children?: SpendNode[];
};

export const CONSOLIDATED: Series = [2574.1, 2716.9, 2806.1, 2908.3, 3020.5];

export const FUNCTIONS: SpendNode[] = [
  {
    id: "learn",
    name: "Learning and culture",
    growth: 3.4,
    values: [513.9, 534.4, 554.9, 573.5, 591.4],
    blurb:
      "Schools, universities, colleges, NSFAS and arts. Teachers’ pay is the bulk of it.",
    children: [
      {
        id: "basic-ed",
        name: "Basic education",
        growth: 3.3,
        values: [345.9, 363.4, 378.2, 390.2, 400.6],
        blurb: "Provincial schooling, including teacher compensation.",
      },
      {
        id: "post-school",
        name: "Post-school education and training",
        growth: 4.0,
        values: [155.7, 157.7, 163.7, 170.1, 177.2],
        blurb: "Universities, TVET colleges and student funding.",
      },
      {
        id: "arts",
        name: "Arts, culture, sport and recreation",
        growth: 0.4,
        values: [12.3, 13.4, 13.0, 13.2, 13.5],
        blurb: "The smallest slice of the learning function.",
      },
    ],
  },
  {
    id: "health",
    name: "Health",
    growth: 3.5,
    values: [294.1, 311.3, 322.8, 335.4, 345.5],
    blurb:
      "Provincial hospitals and clinics. Table 4.2 does not split this function further. Personnel is the main cost.",
  },
  {
    id: "social",
    name: "Social development",
    growth: 3.2,
    values: [415.7, 437.4, 453.3, 464.5, 481.3],
    blurb:
      "Grants, social security funds (UIF, compensation funds) and public-sector pensions. Grants are inside social protection, not the whole line.",
    children: [
      {
        id: "protection",
        name: "Social protection",
        growth: 3.6,
        values: [315.4, 326.2, 339.2, 348.5, 362.9],
        blurb:
          "SASSA grants sit here, together with the administration around them. The October 2026 statement put grants themselves at just under R290 billion this year.",
      },
      {
        id: "ssf",
        name: "Social security funds",
        growth: 1.9,
        values: [90.9, 100.8, 103.0, 104.6, 106.6],
        blurb: "Funds such as the UIF and compensation funds, not the SASSA grant budget.",
      },
      {
        id: "pensions",
        name: "Public-sector pensions",
        growth: 4.2,
        values: [9.4, 10.4, 11.1, 11.4, 11.8],
        blurb: "Government’s contribution toward public-service retirement funding.",
      },
    ],
  },
  {
    id: "community",
    name: "Community development",
    growth: 3.3,
    values: [282.2, 287.5, 308.2, 322.0, 317.2],
    blurb:
      "Municipal services, housing and public transport support. Free basic services are funded largely through the local government equitable share.",
  },
  {
    id: "economic",
    name: "Economic development",
    growth: 4.4,
    values: [271.6, 302.7, 296.6, 317.9, 344.1],
    blurb:
      "The fastest-growing function in this table, pulled up by transport and economic infrastructure.",
    children: [
      {
        id: "industry",
        name: "Industrialisation and exports",
        growth: 0.0,
        values: [49.8, 47.5, 46.6, 48.2, 47.6],
        blurb: "Trade, industry and incentive programmes.",
      },
      {
        id: "agri",
        name: "Agriculture and rural development",
        growth: 4.5,
        values: [34.7, 39.8, 41.8, 44.0, 45.4],
        blurb: "Includes the 2026/27 foot-and-mouth response inside the agriculture budget.",
      },
      {
        id: "labour",
        name: "Labour affairs and works programmes",
        growth: 4.7,
        values: [10.5, 11.8, 12.5, 13.2, 13.6],
        blurb: "Labour regulation and public employment programmes.",
      },
      {
        id: "infra",
        name: "Economic regulation and infrastructure",
        growth: 5.7,
        values: [155.7, 181.5, 173.1, 189.3, 214.7],
        blurb: "The large line: roads, rail, energy regulation and related infrastructure.",
      },
      {
        id: "science",
        name: "Innovation, science and technology",
        growth: 1.4,
        values: [20.9, 22.0, 22.7, 23.2, 22.9],
        blurb: "Science councils and innovation support.",
      },
    ],
  },
  {
    id: "peace",
    name: "Peace and security",
    growth: 2.0,
    values: [269.9, 284.8, 283.7, 292.7, 301.8],
    blurb: "Police, defence, courts, prisons and home affairs. Personnel is about 71% of this function.",
    children: [
      {
        id: "defence",
        name: "Defence and state security",
        growth: 1.6,
        values: [62.3, 62.4, 61.3, 63.2, 65.5],
        blurb: "Defence and state-security departments.",
      },
      {
        id: "police",
        name: "Police services",
        growth: 3.0,
        values: [133.1, 141.5, 145.5, 150.2, 154.7],
        blurb: "The largest peace-and-security line. Funding is being shifted toward forensics.",
      },
      {
        id: "courts",
        name: "Law courts and prisons",
        growth: 2.7,
        values: [58.9, 62.9, 63.9, 66.0, 68.1],
        blurb: "Justice, courts and correctional services.",
      },
      {
        id: "home",
        name: "Home affairs",
        growth: -9.1,
        values: [15.7, 18.0, 13.0, 13.3, 13.5],
        blurb: "Steps down sharply after 2026/27 in the published estimates.",
      },
    ],
  },
  {
    id: "gps",
    name: "General public services",
    growth: 0.1,
    values: [85.0, 94.9, 89.5, 93.0, 95.3],
    blurb: "The centre of the state: the executive, legislatures, Treasury-type administration and foreign affairs.",
    children: [
      {
        id: "executive",
        name: "Executive and legislative organs",
        growth: -0.6,
        values: [23.0, 23.0, 21.4, 21.9, 22.6],
        blurb: "Presidency, Parliament and provincial legislatures in this function line.",
      },
      {
        id: "admin",
        name: "Public administration and fiscal affairs",
        growth: 0.1,
        values: [53.2, 61.9, 58.1, 60.8, 62.1],
        blurb: "Public service administration and the fiscal centre.",
      },
      {
        id: "external",
        name: "External affairs",
        growth: 2.2,
        values: [8.8, 9.9, 9.9, 10.3, 10.6],
        blurb: "International relations.",
      },
    ],
  },
  {
    id: "financial",
    name: "Payments for financial assets",
    growth: null,
    values: [23.8, 12.4, 9.6, 11.8, 8.5],
    blurb: "Loans and equity-type payments. Not a service delivered to the public.",
  },
  {
    id: "debt",
    name: "Debt-service costs",
    growth: 4.9,
    values: [417.9, 441.5, 462.5, 480.6, 509.3],
    blurb:
      "Interest on government debt. It is real spending: in 2026/27 it is larger than health, and larger than policing, defence and courts combined.",
  },
  {
    id: "contingency",
    name: "Contingency reserve",
    growth: null,
    values: [0, 10.0, 25.1, 17.0, 26.1],
    blurb:
      "Held back for shocks. In 2026/27 it was lifted to R10 billion for El Niño, drought and energy-price risk. The 2025/26 outcome shows no remaining reserve.",
  },
];

export const GROUPS: { id: string; name: string; ids: string[] }[] = [
  { id: "social", name: "Social services", ids: ["learn", "health", "social"] },
  { id: "place", name: "Community", ids: ["community"] },
  { id: "economy", name: "Economy", ids: ["economic"] },
  { id: "order", name: "Peace and security", ids: ["peace"] },
  { id: "state", name: "The centre", ids: ["gps"] },
  { id: "debt", name: "Debt service", ids: ["debt"] },
];

/** Main-budget revenue. Annexure C, Table C.8. */
export const REVENUE = {
  pit: { name: "Personal income tax", values: [790.6, 846.4, 901.3, 956.8, 1014.7] as Series },
  cit: { name: "Corporate income tax", values: [345.4, 398.5, 410.7, 425.4, 446.2] as Series },
  vat: { name: "Value-added tax", values: [500.6, 533.9, 554.0, 583.7, 612.1] as Series },
  customs: { name: "Customs and excise", values: [151.3, 164.1, 169.1, 178.8, 189.5] as Series },
  other: { name: "Other tax", values: [222.4, 201.2, 247.0, 259.0, 272.2] as Series },
  gross: { name: "Gross tax revenue", values: [2010.3, 2144.0, 2282.0, 2403.6, 2534.7] as Series },
  nontax: { name: "Non-tax revenue", values: [43.9, 54.5, 40.4, 31.8, 29.9] as Series },
  nrf: { name: "National Revenue Fund receipts", values: [13.9, 16.0, 1.7, 1.6, 1.2] as Series },
  sacu: { name: "SACU payments", values: [-73.6, -78.4, -92.6, -86.3, -90.7] as Series },
  main: { name: "Main budget revenue", values: [1994.6, 2136.1, 2231.5, 2350.7, 2475.1] as Series },
};

/** 2029/30 gross tax is PIT+CIT+VAT+customs+other from C.8 (2 534.7). Table 3.3 text said ~R2.53 trillion. */

export const MAIN_SPEND: Series = [2331.7, 2437.8, 2515.3, 2609.1, 2708.7];
export const MAIN_BALANCE: Series = [-337.1, -301.6, -283.8, -258.4, -233.6];
export const PRIMARY_BALANCE: Series = [80.8, 139.9, 178.7, 222.1, 275.7];
export const DEBT_GDP: Series = [78.4, 78.2, 77.9, 77.5, 76.6];
export const GDP: Series = [7787.3, 8126.6, 8571.6, 8992.4, 9451.3];

/** Table 3.1, only the two years it publishes. R billion. */
export const TAX_DETAIL: Record<string, { name: string; y2025: number; y2026: number }> = {
  pit: { name: "Personal income tax", y2025: 790.6, y2026: 846.4 },
  cit: { name: "Corporate income tax", y2025: 345.4, y2026: 398.5 },
  vat: { name: "Value-added tax", y2025: 500.6, y2026: 533.9 },
  dividends: { name: "Dividends tax", y2025: 45.9, y2026: 51.1 },
  excise: { name: "Specific excise duties", y2025: 61.7, y2026: 66.0 },
  fuel: { name: "General fuel levy", y2025: 95.2, y2026: 74.0 },
  customs: { name: "Customs duties", y2025: 81.5, y2026: 89.7 },
  advalorem: { name: "Ad valorem excise", y2025: 8.0, y2026: 8.5 },
  other: { name: "Other taxes", y2025: 81.3, y2026: 76.0 },
};

export type EconNode = { id: string; name: string; values: Series; children?: EconNode[] };

export const ECONOMIC: EconNode[] = [
  {
    id: "comp",
    name: "Compensation of employees",
    values: [804.1, 856.4, 895.6, 928.5, 957.6],
  },
  {
    id: "goods",
    name: "Goods and services",
    values: [353.4, 365.7, 366.2, 376.9, 390.6],
  },
  {
    id: "interest",
    name: "Interest and rent on land",
    values: [426.0, 450.2, 472.0, 493.2, 522.2],
  },
  {
    id: "transfers",
    name: "Transfers and subsidies",
    values: [843.6, 873.7, 891.4, 916.8, 942.0],
    children: [
      { id: "hh", name: "Households", values: [456.0, 473.5, 479.8, 492.7, 512.6] },
      {
        id: "pm",
        name: "Provinces and municipalities",
        values: [190.2, 195.6, 214.9, 222.1, 224.5],
      },
      {
        id: "pc",
        name: "Public corporations and private enterprises",
        values: [68.3, 62.4, 46.8, 48.4, 46.6],
      },
      {
        id: "hei",
        name: "Higher education institutions",
        values: [55.5, 58.3, 59.9, 62.8, 65.6],
      },
      { id: "npi", name: "Non-profit institutions", values: [43.2, 46.3, 50.4, 51.3, 52.9] },
      {
        id: "agencies",
        name: "Departmental agencies and accounts",
        values: [27.3, 34.2, 36.1, 35.7, 35.7],
      },
      {
        id: "foreign",
        name: "Foreign governments and organisations",
        values: [3.1, 3.5, 3.7, 3.8, 3.9],
      },
    ],
  },
  {
    id: "capital",
    name: "Payments for capital assets",
    values: [123.2, 148.4, 146.2, 164.2, 173.5],
    children: [
      {
        id: "buildings",
        name: "Buildings and other fixed structures",
        values: [91.3, 108.5, 107.9, 120.8, 139.7],
      },
      {
        id: "machinery",
        name: "Machinery and equipment",
        values: [31.9, 40.0, 38.3, 43.4, 33.8],
      },
    ],
  },
  {
    id: "fin",
    name: "Payments for financial assets",
    values: [23.8, 12.4, 9.6, 11.8, 8.5],
  },
  {
    id: "reserve",
    name: "Contingency reserve",
    values: [0, 10.0, 25.1, 17.0, 26.1],
  },
];

export type Sphere = { id: string; name: string; values: Series };

/** Table 4.3, division of available funds. Excludes debt-service costs. */
export const SPHERES: Sphere[] = [
  { id: "national", name: "National departments", values: [946.5, 968.2, 940.8, 989.2, 998.7] },
  { id: "provinces", name: "Provinces", values: [788.8, 817.6, 850.5, 879.2, 907.5] },
  { id: "local", name: "Local government", values: [178.5, 184.1, 201.1, 207.8, 209.8] },
];

export const PROVINCIAL_EQ_SHARE = [
  { name: "Gauteng", m: 141782 },
  { name: "KwaZulu-Natal", m: 137067 },
  { name: "Eastern Cape", m: 88227 },
  { name: "Limpopo", m: 79957 },
  { name: "Western Cape", m: 69967 },
  { name: "Mpumalanga", m: 56120 },
  { name: "North West", m: 47240 },
  { name: "Free State", m: 37973 },
  { name: "Northern Cape", m: 18369 },
];

/** 2026/27 grant picture reported with the MTBPS. Counts are beneficiaries, not a budget line. */
export const GRANTS_2026 = [
  { name: "Old-age grant", people: 4_200_000, monthly: 2400 },
  { name: "Child support grant", people: 12_300_000, monthly: 580 },
  { name: "Disability grant", people: 1_100_000, monthly: 2400 },
  { name: "Covid SRD grant", people: 8_200_000, monthly: 370 },
  { name: "Other permanent grants", people: 400_000, monthly: null },
];

export const LEAKS = [
  {
    id: "irregular",
    title: "Irregular expenditure, national and provinces",
    figure: "R42.6 billion",
    when: "Incurred in 2024/25",
    detail:
      "Auditor-General. Procurement and contract failures were the main driver. This is a different year from the 2026/27 budget, and it is not subtracted from the tables above.",
  },
  {
    id: "fruitless",
    title: "Fruitless and wasteful expenditure",
    figure: "R1.4 billion",
    when: "Incurred in 2024/25",
    detail:
      "Auditor-General, national and provincial auditees. A further R1.6 billion was still under assessment.",
  },
  {
    id: "uifw",
    title: "Municipal irregular, fruitless and wasteful balance",
    figure: "R268 billion",
    when: "Closing balance, 2024/25",
    detail:
      "National Treasury, MFMA compliance report. This is a stock of past breaches, not money spent once in that year. It rose from R264 billion the year before. Councils write much of it off instead of recovering it.",
  },
  {
    id: "clean",
    title: "Clean audits vs the money",
    figure: "12% of spend",
    when: "2024/25 PFMA audits",
    detail:
      "151 of 417 departments and entities achieved a clean audit, and those 151 accounted for only about 12% of expenditure. Findings sat on the other 88%.",
  },
  {
    id: "withhold",
    title: "Equitable share withheld",
    figure: "69 municipalities",
    when: "July 2026",
    detail:
      "Treasury stopped the July transfer where councils were not paying bulk suppliers, SARS, the Auditor-General or pension funds. 38 agreed repayment plans. Creditors had been paid R4.2 billion by 31 July 2026.",
  },
  {
    id: "owed",
    title: "Government owing municipalities",
    figure: "R27.6 billion",
    when: "Reported at 31 December 2025",
    detail:
      "What municipalities say public bodies owe them. More than half of that was provincial departments.",
  },
];

export function yearIndex(id: YearId): number {
  return YEARS.findIndex((y) => y.id === id);
}

export function at(series: Series, index: number): number {
  return series[index] ?? 0;
}

export function sumNodes(nodes: { values: Series }[], index: number): number {
  return nodes.reduce((s, n) => s + n.values[index], 0);
}
