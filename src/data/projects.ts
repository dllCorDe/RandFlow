/** Named projects an ordinary reader can follow.
 *  Every figure is a published number. Where two official numbers disagree, both are shown.
 *  This is not the full project list of the state.
 */

export type ProjectSector = "water" | "power" | "rail" | "bailout";
export type ProjectStatus = "unfinished" | "overrun" | "disputed";

export type Project = {
  id: string;
  name: string;
  place: string;
  province: string;
  sector: ProjectSector;
  status: ProjectStatus;
  statusLabel: string;
  plain: string;
  promised: string;
  spent: string;
  got: string;
  why: string;
  who: { role: string; name: string }[];
  source: string;
};

export const SECTORS: { id: ProjectSector | "all"; label: string }[] = [
  { id: "all", label: "All projects" },
  { id: "water", label: "Water" },
  { id: "power", label: "Electricity" },
  { id: "rail", label: "Trains" },
  { id: "bailout", label: "Bailouts" },
];

export const STATUSES: { id: ProjectStatus | "all"; label: string }[] = [
  { id: "all", label: "Any result" },
  { id: "unfinished", label: "Still not finished" },
  { id: "overrun", label: "Cost far more" },
  { id: "disputed", label: "Books don't agree" },
];

export const PROJECTS: Project[] = [
  {
    id: "giyani",
    name: "Giyani water",
    place: "Limpopo, 55 villages",
    province: "Limpopo",
    sector: "water",
    status: "unfinished",
    statusLabel: "Still not finished",
    plain:
      "A job to bring tap water to villages. It started as a small emergency repair and became a multi-billion rand contract without a new tender.",
    promised:
      "In August 2014, fix the water and wastewater works. The emergency price was R90 million.",
    spent:
      "A month later Lepelle Northern Water extended the same contractor to R2.2 billion, with no new procurement. The SIU found about R4.1 billion was then paid, more than that contract. In August 2026 the deputy minister told Parliament the wider intervention had passed R48 billion, against an early hope of under R100 million. That R48 billion is what he said in the committee. It is not the SIU’s R4.1 billion payment figure. They are different pots.",
    got:
      "Pipes have been laid and some households in 23 villages were reported connected in 2026. Phase 2, the remaining villages, had not started. The Auditor-General said a Giyani water-services package due in June 2020 was still under construction in July 2026.",
    why:
      "People paid for water for years and many still do not have a working tap. The SIU called the jump from R90 million to R2.2 billion irregular and unlawful, including because the contractor was not properly registered to do public construction work. The contract was taken to court to be set aside.",
    who: [
      { role: "Department", name: "Water and Sanitation" },
      { role: "Implementer", name: "Lepelle Northern Water" },
      { role: "Contractor", name: "LTE Consulting" },
      { role: "Investigating", name: "Special Investigating Unit" },
    ],
    source:
      "SIU briefing to Scopa, November 2023. Auditor-General presentation to Parliament, 6 October 2026. Deputy minister’s remark to the water portfolio committee, 26 August 2026, as reported.",
  },
  {
    id: "sebokeng",
    name: "Sebokeng wastewater, module 7",
    place: "Emfuleni, Gauteng",
    province: "Gauteng",
    sector: "water",
    status: "unfinished",
    statusLabel: "Stuck before building",
    plain:
      "A sewage module that was supposed to be open in 2025. By July 2026 the state was still choosing who would build it.",
    promised: "Start in 2022. Commission in 2025.",
    spent:
      "Counted inside R5.2 billion of delayed water projects. The Auditor-General did not publish a standalone price for this module in that briefing.",
    got: "Nothing built yet. In July 2026 it was still at tender adjudication, three years late.",
    why:
      "Sewage that is not treated lands in the river. A project that never leaves the tender room is money and time the public does not get back, even before a contractor is paid.",
    who: [
      { role: "Owner", name: "Department of Water and Sanitation, Water Trading Entity" },
      { role: "Serves", name: "Emfuleni" },
      { role: "Checked by", name: "Auditor-General" },
    ],
    source: "Auditor-General, infrastructure briefing, 6 October 2026.",
  },
  {
    id: "water-pile",
    name: "The delayed water pile",
    place: "Water boards, national",
    province: "National",
    sector: "water",
    status: "unfinished",
    statusLabel: "R5.2 billion still unfinished",
    plain:
      "Most of the water department’s half-built work is late. This is the pile, not one tap.",
    promised: "New works and repairs that should already be in use.",
    spent:
      "R5.186 billion of assets still under construction were delayed in 2025/26. That was 65% of the under-construction book, up from R4.586 billion the year before. About R3.3 billion is new builds and R1.8 billion is refurbishment.",
    got:
      "One named dispute, Giyani and the raising of Tzaneen Dam: R333 million spent, R372 million delayed, 63% done by March 2026, after the implementing agent was changed.",
    why:
      "Unfinished construction is not the same as stolen cash. It is money locked in concrete that does not yet deliver water. The longer it sits, the more it costs to finish, and the more it shows up as fruitless risk in the next audit.",
    who: [
      { role: "Department", name: "Water and Sanitation" },
      { role: "Checked by", name: "Auditor-General" },
    ],
    source: "Auditor-General, 6 October 2026 parliamentary briefing.",
  },
  {
    id: "medupi",
    name: "Medupi power station",
    place: "Lephalale, Limpopo",
    province: "Limpopo",
    sector: "power",
    status: "overrun",
    statusLabel: "Built, years late, interest extra",
    plain:
      "A coal station the country needed during load shedding. The construction bill Eskom owns up to is not the full bill.",
    promised:
      "New baseload power. Eskom’s approved construction budget, still, is R145 billion.",
    spent:
      "Eskom says R131.1 billion had been spent on construction by June 2026. That figure leaves out interest while it was being built. A World Bank completion assessment, cited in Parliament in 2026, put construction at R132.2 billion plus about R44.6 billion of interest. Flue-gas cleaning to meet emissions rules is a further project, estimated around R42 billion, and is not inside the R145 billion.",
    got:
      "The station is operating. It was more than a decade late. While it was late, Eskom burned diesel: R33 billion in 2023/24, down to R7.1 billion in 2025/26 once the new stations were actually producing.",
    why:
      "The waste is the years without the power, the diesel burned instead, and the interest on money borrowed while the build dragged. Do not treat newspaper totals of R176 billion or R233 billion as Eskom’s approved budget. Eskom has rejected those as its construction cost. The interest and the cleaning plant are real extra costs, and they should be labelled as extras, not as the construction budget.",
    who: [
      { role: "Owner", name: "Eskom" },
      { role: "Paid by", name: "Electricity users and, through bailouts, taxpayers" },
      { role: "Lenders", name: "Including the World Bank on part of the finance" },
    ],
    source:
      "Eskom media statement, 10 September 2026. World Bank completion figures as cited by Kevin Mileham, September 2026. Eskom on diesel, September 2026.",
  },
  {
    id: "kusile",
    name: "Kusile power station",
    place: "Mpumalanga",
    province: "Mpumalanga",
    sector: "power",
    status: "overrun",
    statusLabel: "Built, years late",
    plain: "Medupi’s twin. Eskom’s construction number is R160.5 billion. The interest on the delay is a separate story.",
    promised: "Approved construction budget R160.5 billion.",
    spent:
      "R155.5 billion recorded by 31 July 2026. Same warning as Medupi: capitalised interest during the long build is not in that construction budget. Eskom has not published R233 billion as its project cost. That higher number is an outside estimate.",
    got:
      "Eskom says the station is now fully operational, after years of delay and a collapsed flue duct that took units offline. The public got the megawatts late.",
    why:
      "Late power is not free. The extra years are extra interest and extra diesel. Call the overrun what it is, and do not add an unsourced headline on top of Eskom’s own books.",
    who: [
      { role: "Owner", name: "Eskom" },
      { role: "Paid by", name: "Electricity users and taxpayers" },
    ],
    source: "Eskom media statement, 10 September 2026.",
  },
  {
    id: "eskom-relief",
    name: "Eskom debt relief",
    place: "National Revenue Fund",
    province: "National",
    sector: "bailout",
    status: "disputed",
    statusLabel: "Taxpayers paying Eskom’s lenders",
    plain:
      "This is not a new power station. It is the state taking over Eskom’s debt so the utility can keep the lights on.",
    promised: "A multi-year takeover of Eskom debt, tied to conditions.",
    spent:
      "Treasury’s October 2026 statement: R76 billion in 2023/24, R64 billion in 2024/25, R80 billion in 2025/26, and R10 billion still pencilled in for 2028/29. That is R220 billion already arranged, before the last R10 billion.",
    got:
      "The money goes to Eskom’s creditors. It does not build a clinic. In return the state expects Eskom to stop needing new bailouts. Whether that holds is the open question.",
    why:
      "A bailout can be the least-bad option and still be a transfer away from schools and grants. It sits outside the function ring as a financing item. If you want to see who was paid, the answer is bondholders, not a village contractor.",
    who: [
      { role: "Payer", name: "National Treasury, from taxes and borrowing" },
      { role: "Receiver", name: "Eskom, then its lenders" },
    ],
    source: "National Treasury, MTBPS 21 October 2026, main budget framework, Eskom debt-relief line.",
  },
  {
    id: "locos",
    name: "1,064 locomotives",
    place: "Transnet freight rail",
    province: "National",
    sector: "rail",
    status: "disputed",
    statusLabel: "Price jumped, books still fought over",
    plain:
      "Trains to move coal and containers. The board price and the final bill are not the same, and the auditor and Transnet still disagree on the paperwork.",
    promised:
      "Transnet’s board approved 1,064 locomotives in 2013 at R38.6 billion, before foreign-exchange hedging and escalation.",
    spent:
      "The prosecuting authority says the cost rose to R54.4 billion through contract changes, forex and increases the board had not approved. Between 2014 and 2020 Transnet paid China South Rail R5.1 billion on a separate 100-locomotive contract, R348 million over that contract. The SIU has a preservation order of R4.2 billion against CRRC E-Loco Supply. It has also recovered smaller sums from other suppliers, including about R380 million from Bombardier and R70 million from General Electric.",
    got:
      "Some locomotives were delivered and some were not fit for the network for years. The Auditor-General still treats about R42.9 billion of the 1,064 deal as irregular. In March 2026 Transnet told Parliament it had tried to take that amount off its irregular-expenditure book. The AG says the criminal case is not finished, so it stays.",
    why:
      "Irregular does not always mean the locomotive does not exist. It means the way it was bought broke the rules, and the price went up after the decision. The gap between R38.6 billion and R54.4 billion is the part a citizen can point at without guessing.",
    who: [
      { role: "Buyer", name: "Transnet" },
      { role: "Suppliers", name: "China South Rail / CRRC, and other locomotive makers" },
      { role: "Chasing it", name: "SIU, NPA, Auditor-General" },
    ],
    source:
      "NPA charge sheet as reported 1 July 2025. Presidency progress report on the state-capture commission, July 2025. Transnet and the AG at Scopa, March 2026.",
  },
];
