import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, FolderOpen, Landmark, Scale, Search, TriangleAlert } from "lucide-react";
import {
  CONSOLIDATED,
  DEBT_GDP,
  ECONOMIC,
  FUNCTIONS,
  GDP,
  GRANTS_2026,
  GROUPS,
  LEAKS,
  MAIN_BALANCE,
  MAIN_SPEND,
  PRIMARY_BALANCE,
  PROVINCIAL_EQ_SHARE,
  REVENUE,
  SPHERES,
  TAX_DETAIL,
  YEARS,
  at,
  type EconNode,
  type SpendNode,
} from "@/data/budget";
import { formatBn, formatPeople, formatPct, formatRand, share } from "@/lib/format";
import { FlowBar, SpendRing } from "@/components/spend-ring";
import { ProjectsView } from "@/components/projects-view";
import type { ProjectSector } from "@/data/projects";

type Tab = "eye" | "raised" | "spheres" | "pressure" | "projects";

const PEOPLE = 63_000_000;

const TABS: { id: Tab; label: string; icon: typeof Eye }[] = [
  { id: "eye", label: "God's eye", icon: Eye },
  { id: "raised", label: "Where it's raised", icon: Landmark },
  { id: "spheres", label: "Who spends it", icon: Scale },
  { id: "pressure", label: "The leaks", icon: TriangleAlert },
  { id: "projects", label: "The projects", icon: FolderOpen },
];

function perPerson(billions: number): number {
  return (billions * 1_000_000_000) / PEOPLE;
}

function findNode(id: string): SpendNode | undefined {
  for (const node of FUNCTIONS) {
    if (node.id === id) return node;
    const child = node.children?.find((c) => c.id === id);
    if (child) return child;
  }
  return undefined;
}

export function Dashboard() {
  const [year, setYear] = useState(1);
  const [tab, setTab] = useState<Tab>("eye");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [trace, setTrace] = useState("100");
  const [openEcon, setOpenEcon] = useState<string | null>("transfers");
  const [projectSector, setProjectSector] = useState<ProjectSector | "all">("all");

  const y = YEARS[year];
  const total = at(CONSOLIDATED, year);
  const group = GROUPS.find((g) => g.id === groupId) ?? null;
  const groupIds = group?.ids ?? null;

  const slices = FUNCTIONS.map((node) => ({
    id: node.id,
    name: node.name,
    value: at(node.values, year),
  }));

  const needle = query.trim().toLowerCase();

  const visible = useMemo(() => {
    return FUNCTIONS.filter((node) => {
      if (!needle) return true;
      if (node.name.toLowerCase().includes(needle)) return true;
      return node.children?.some((c) => c.name.toLowerCase().includes(needle)) ?? false;
    });
  }, [needle]);

  const focus = focusId ? findNode(focusId) : undefined;
  const traceValue = Number(trace.replace(/[^\d.]/g, ""));
  const safeTrace = Number.isFinite(traceValue) && traceValue > 0 ? traceValue : 0;

  function openProjects(sector: ProjectSector | "all") {
    setProjectSector(sector);
    setTab("projects");
  }

  function pickFunction(id: string) {
    setGroupId(null);
    setFocusId((current) => (current === id ? null : id));
  }

  function pickGroup(id: string) {
    setFocusId(null);
    setGroupId((current) => (current === id ? null : id));
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs tracking-[0.18em] text-brass uppercase">Randflow</p>
          <h1 className="mt-2 font-display text-4xl text-balance text-fg sm:text-5xl">
            Where the rand goes
          </h1>
          <p className="mt-3 text-pretty text-muted">
            A god’s-eye on consolidated spending, the taxes that raise it, and which sphere
            actually spends it. Figures are the 21 October 2026 Medium Term Budget Policy
            Statement, not a live Treasury feed.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Fiscal year">
          {YEARS.map((item, index) => {
            const on = index === year;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setYear(index)}
                className={
                  "min-h-11 shrink-0 rounded-full border px-3 py-2 text-left " +
                  (on
                    ? "border-brass bg-brass text-brass-ink"
                    : "border-line bg-panel text-fg")
                }
              >
                <span className="block text-sm font-medium tabular-nums">{item.label}</span>
                <span className={"block text-xs " + (on ? "text-brass-ink" : "text-muted")}>
                  {item.status}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Year totals">
        <Kpi label="Consolidated spending" value={formatBn(total)} hint={`${formatRand(perPerson(total))} per person`} />
        <Kpi
          label="Main budget revenue"
          value={formatBn(at(REVENUE.main.values, year))}
          hint={`Deficit ${formatBn(at(MAIN_BALANCE, year))}`}
        />
        <Kpi
          label="Debt-service costs"
          value={formatBn(at(FUNCTIONS.find((f) => f.id === "debt")!.values, year))}
          hint={formatPct(share(at(FUNCTIONS.find((f) => f.id === "debt")!.values, year), total)) + " of spending"}
        />
        <Kpi
          label="Gross debt"
          value={formatPct(at(DEBT_GDP, year))}
          hint={`of GDP · ${formatBn(at(GDP, year), 0)}`}
        />
      </section>

      <div className="mt-6 flex gap-2 overflow-x-auto" role="tablist" aria-label="Views">
        {TABS.map((item) => {
          const on = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(item.id)}
              className={
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm " +
                (on ? "border-brass bg-raised text-fg" : "border-line bg-transparent text-muted")
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
        <Link
          to="/links"
          className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-4 text-sm text-fg"
        >
          Company links
        </Link>
      </div>

      <div className="mt-4" role="tabpanel">
        {tab === "eye" && (
          <EyeView
            year={year}
            yearLabel={y.label}
            total={total}
            slices={slices}
            visible={visible}
            focus={focus}
            focusId={focusId}
            group={group}
            groupIds={groupIds}
            query={query}
            needle={needle}
            trace={trace}
            safeTrace={safeTrace}
            openEcon={openEcon}
            onQuery={setQuery}
            onPick={pickFunction}
            onGroup={pickGroup}
            onTrace={setTrace}
            onEcon={setOpenEcon}
            onOpenProjects={openProjects}
          />
        )}
        {tab === "raised" && <RaisedView year={year} />}
        {tab === "spheres" && <SpheresView year={year} />}
        {tab === "pressure" && <PressureView onOpenProjects={openProjects} />}
        {tab === "projects" && <ProjectsView sector={projectSector} onSector={setProjectSector} />}
      </div>

      <footer className="mt-10 border-t border-line pt-6 text-sm text-pretty text-muted">
        <p>
          Source: National Treasury, Medium Term Budget Policy Statement, 21 October 2026 —
          Tables 3.1, 3.8, 4.1, 4.2, 4.3 and 4.4, and Annexure C. Grant beneficiary counts and
          monthly values are as reported with that statement. The live tender register is read from
          National Treasury’s eTenders portal and only includes what organs of state captured
          there. The investigated cases use the SIU, the Auditor-General’s October 2026
          infrastructure briefing, Eskom’s 10 September 2026 cost statement, the NPA’s locomotive
          charges, and Treasury’s Eskom debt-relief line. Where two official numbers disagree,
          both are shown. Per-person figures divide by 63
          million people and are a scale, not an official statistic. Oversight numbers on the
          leaks view are from the Auditor-General’s 2024/25 PFMA report and Treasury’s municipal
          finance reports. They are not deducted from these budgets.
        </p>
        <p className="mt-3">
          Go further on the official portals:{" "}
          <a className="text-brass underline decoration-line underline-offset-2" href="https://vulekamali.gov.za/">
            Vulekamali
          </a>
          {" · "}
          <a className="text-brass underline decoration-line underline-offset-2" href="https://municipalmoney.gov.za/">
            Municipal Money
          </a>
          {" · "}
          <a className="text-brass underline decoration-line underline-offset-2" href="https://data.etenders.gov.za/">
            Procurement payments
          </a>
          {" · "}
          <a className="text-brass underline decoration-line underline-offset-2" href="https://www.agsa.co.za/">
            Auditor-General
          </a>
          .
        </p>
      </footer>
    </main>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-2xl border border-line bg-panel px-4 py-3">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl text-fg tabular-nums sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm text-muted tabular-nums">{hint}</p>
    </article>
  );
}

function EyeView({
  year,
  yearLabel,
  total,
  slices,
  visible,
  focus,
  focusId,
  group,
  groupIds,
  query,
  needle,
  trace,
  safeTrace,
  openEcon,
  onQuery,
  onPick,
  onGroup,
  onTrace,
  onEcon,
  onOpenProjects,
}: {
  year: number;
  yearLabel: string;
  total: number;
  slices: { id: string; name: string; value: number }[];
  visible: SpendNode[];
  focus: SpendNode | undefined;
  focusId: string | null;
  group: (typeof GROUPS)[number] | null;
  groupIds: string[] | null;
  query: string;
  needle: string;
  trace: string;
  safeTrace: number;
  openEcon: string | null;
  onQuery: (value: string) => void;
  onPick: (id: string) => void;
  onGroup: (id: string) => void;
  onTrace: (value: string) => void;
  onEcon: (id: string | null) => void;
  onOpenProjects: (sector: ProjectSector | "all") => void;
}) {
  const rollup = group
    ? FUNCTIONS.filter((node) => group.ids.includes(node.id))
    : null;
  const rollupValue = rollup?.reduce((sum, node) => sum + at(node.values, year), 0) ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <section className="iris overflow-hidden rounded-2xl border border-line p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-fg">The whole fiscus</h2>
            <p className="text-sm text-muted">{yearLabel} consolidated expenditure, by function.</p>
          </div>
        </div>
        <SpendRing
          slices={slices}
          total={total}
          activeId={focusId}
          groupIds={groupIds}
          onPick={onPick}
        />
        <FlowBar
          slices={slices}
          total={total}
          activeId={focusId}
          groupIds={groupIds}
          onPick={onPick}
        />
        <div className="mt-4 flex gap-2 overflow-x-auto">
          <Chip on={groupIdOf(group) == null && !focusId} onClick={() => onGroup("")} label="All of it" />
          {GROUPS.map((item) => {
            const value = FUNCTIONS.filter((node) => item.ids.includes(node.id)).reduce(
              (sum, node) => sum + at(node.values, year),
              0,
            );
            return (
              <Chip
                key={item.id}
                on={group?.id === item.id}
                onClick={() => onGroup(item.id)}
                label={`${item.name} · ${formatPct(share(value, total), 0)}`}
              />
            );
          })}
        </div>
        <form
          className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="block flex-1 text-sm text-muted">
            Follow an amount through this year’s split
            <input
              inputMode="decimal"
              value={trace}
              onChange={(event) => onTrace(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-line bg-ink px-3 text-fg tabular-nums"
              aria-label="Rand amount to split"
            />
          </label>
          <p className="pb-3 text-sm text-muted sm:pb-2">rands, not billions</p>
        </form>
        <ul className="mt-2 divide-y divide-line">
          {(focus?.children && focus.children.length
            ? focus.children.map((child) => ({
                id: child.id,
                name: child.name,
                value: at(child.values, year),
                base: at(focus.values, year),
              }))
            : slices.map((slice) => ({
                id: slice.id,
                name: slice.name,
                value: slice.value,
                base: total,
              }))
          )
            .filter((row) => row.value > 0)
            .map((row) => {
              const portion = row.base ? (row.value / row.base) * safeTrace : 0;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onPick(row.id)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm"
                  >
                    <span className="text-fg">{row.name}</span>
                    <span className="shrink-0 text-brass tabular-nums">{formatRand(portion)}</span>
                  </button>
                </li>
              );
            })}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <div className="rounded-2xl border border-line bg-panel p-4">
          {focus ? (
            <Detail
              title={focus.name}
              blurb={focus.blurb}
              value={at(focus.values, year)}
              total={total}
              growth={focus.growth}
              parent={parentOf(focus.id)}
              year={year}
            />
          ) : rollup ? (
            <Detail
              title={group!.name}
              blurb="A category across the function table. Shares are of all consolidated spending, not of the category alone."
              value={rollupValue}
              total={total}
              growth={null}
              parent={null}
              year={year}
            />
          ) : (
            <div>
              <h2 className="font-display text-2xl text-fg">Pick a flow</h2>
              <p className="mt-2 text-sm text-pretty text-muted">
                Every rand in the {yearLabel} consolidated budget is in the ring. Debt service is
                inside that total, not an extra bill. Select a slice or a category.
              </p>
            </div>
          )}
          {focus?.id === "protection" && year === 1 && <GrantCard />}
          <ProjectJump id={focus?.id ?? group?.id ?? null} onOpen={onOpenProjects} />
          {(focus?.children ?? rollup)?.length ? (
            <div className="mt-4 space-y-3">
              {(focus?.children ?? rollup!).map((node) => (
                <BarRow
                  key={node.id}
                  name={node.name}
                  value={at(node.values, year)}
                  max={(focus ? at(focus.values, year) : rollupValue) || 1}
                  dim={Boolean(needle) && !node.name.toLowerCase().includes(needle) && focus == null}
                  onClick={() => onPick(node.id)}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-line bg-panel p-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search functions"
              className="min-h-11 w-full rounded-xl border border-line bg-ink pr-3 pl-9 text-fg"
            />
          </label>
          <ul className="mt-3 max-h-80 space-y-1 overflow-auto">
            {visible.map((node) => (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => onPick(node.id)}
                  className={
                    "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-2 text-left " +
                    (focusId === node.id ? "bg-raised" : "")
                  }
                >
                  <span className="text-sm text-fg">{node.name}</span>
                  <span className="text-sm text-brass tabular-nums">
                    {formatBn(at(node.values, year))}
                  </span>
                </button>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="px-2 py-4 text-sm text-muted">Nothing in Table 4.2 matches that.</li>
            )}
          </ul>
        </div>

        <EconCut year={year} total={total} openId={openEcon} onOpen={onEcon} />
      </section>
    </div>
  );
}

function groupIdOf(group: (typeof GROUPS)[number] | null): string | null {
  return group?.id ?? null;
}

function parentOf(id: string): string | null {
  for (const node of FUNCTIONS) {
    if (node.children?.some((child) => child.id === id)) return node.name;
  }
  return null;
}

function Chip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "min-h-11 shrink-0 rounded-full border px-3 text-sm " +
        (on ? "border-brass bg-brass text-brass-ink" : "border-line bg-ink/70 text-fg")
      }
    >
      {label}
    </button>
  );
}

function Detail({
  title,
  blurb,
  value,
  total,
  growth,
  parent,
  year,
}: {
  title: string;
  blurb: string;
  value: number;
  total: number;
  growth: number | null;
  parent: string | null;
  year: number;
}) {
  return (
    <div>
      {parent && <p className="text-xs tracking-wide text-muted uppercase">{parent}</p>}
      <h2 className="font-display text-2xl text-balance text-fg">{title}</h2>
      <p className="mt-2 font-display text-4xl text-brass tabular-nums">{formatBn(value)}</p>
      <p className="mt-1 text-sm text-muted tabular-nums">
        {formatPct(share(value, total))} of {YEARS[year].label} spending · {formatRand(perPerson(value))}{" "}
        per person
        {growth != null ? ` · ${growth > 0 ? "+" : "−"}${Math.abs(growth).toFixed(1)}% a year to 2029/30` : ""}
      </p>
      <p className="mt-3 text-sm text-pretty text-muted">{blurb}</p>
    </div>
  );
}

function BarRow({
  name,
  value,
  max,
  onClick,
  dim,
}: {
  name: string;
  value: number;
  max: number;
  onClick?: () => void;
  dim?: boolean;
}) {
  const width = Math.max(2, (value / max) * 100);
  const body = (
    <>
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-fg">{name}</span>
        <span className="text-brass tabular-nums">{formatBn(value)}</span>
      </span>
      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-raised">
        <span className="block h-full rounded-full bg-brass" style={{ width: `${width}%` }} />
      </span>
    </>
  );
  if (!onClick) {
    return <div className={dim ? "opacity-40" : ""}>{body}</div>;
  }
  return (
    <div className={dim ? "opacity-40" : ""}>
      <button type="button" onClick={onClick} className="min-h-11 w-full text-left">
        {body}
      </button>
    </div>
  );
}

function GrantCard() {
  return (
    <div className="mt-4 rounded-xl border border-line bg-ink p-3">
      <p className="text-xs tracking-wide text-brass uppercase">Grants inside this line · 2026/27</p>
      <p className="mt-1 text-sm text-muted">
        Just under R290 billion for grants. About 18 million permanent grants, plus a projected 8.2
        million SRD grants. Monthly value times headcount is not the appropriation.
      </p>
      <ul className="mt-3 space-y-2">
        {GRANTS_2026.map((grant) => (
          <li key={grant.name} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-fg">{grant.name}</span>
            <span className="text-right text-muted tabular-nums">
              {formatPeople(grant.people)}
              {grant.monthly != null ? ` · ${formatRand(grant.monthly)} / month` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EconCut({
  year,
  total,
  openId,
  onOpen,
}: {
  year: number;
  total: number;
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <h2 className="font-display text-xl text-fg">What the rand becomes</h2>
      <p className="mt-1 text-sm text-muted">
        The same {formatBn(total)} cut by economic classification, not extra money.
      </p>
      <div className="mt-4 space-y-3">
        {ECONOMIC.map((node) => (
          <EconRow key={node.id} node={node} year={year} open={openId === node.id} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function EconRow({
  node,
  year,
  open,
  onOpen,
}: {
  node: EconNode;
  year: number;
  open: boolean;
  onOpen: (id: string | null) => void;
}) {
  const value = at(node.values, year);
  const max = at(CONSOLIDATED, year);
  return (
    <div>
      {node.children ? (
        <button type="button" className="min-h-11 w-full text-left" onClick={() => onOpen(open ? null : node.id)}>
          <BarRow name={node.name} value={value} max={max} />
        </button>
      ) : (
        <BarRow name={node.name} value={value} max={max} />
      )}
      {open && node.children && (
        <div className="mt-2 ml-3 space-y-2 border-l border-line pl-3">
          {node.children.map((child) => (
            <BarRow key={child.id} name={child.name} value={at(child.values, year)} max={value || 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function RaisedView({ year }: { year: number }) {
  const gross = at(REVENUE.gross.values, year);
  const lines = [
    REVENUE.pit,
    REVENUE.cit,
    REVENUE.vat,
    REVENUE.customs,
    REVENUE.other,
  ];
  const detailYear = year === 0 || year === 1 ? year : null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <h2 className="font-display text-2xl text-fg">Main budget revenue</h2>
        <p className="mt-1 text-sm text-muted">
          {YEARS[year].label}. Tax is not the same thing as consolidated spending. Spending also
          includes borrowing, social security funds and public entities.
        </p>
        <Bridge
          rows={[
            { name: "Gross tax revenue", value: gross },
            { name: "Non-tax revenue", value: at(REVENUE.nontax.values, year) },
            { name: "Revenue Fund receipts", value: at(REVENUE.nrf.values, year) },
            { name: "SACU payments", value: at(REVENUE.sacu.values, year) },
          ]}
          totalLabel="Main budget revenue"
          total={at(REVENUE.main.values, year)}
        />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Kpi
            label="Main budget spending"
            value={formatBn(at(MAIN_SPEND, year))}
            hint={`Primary surplus ${formatBn(at(PRIMARY_BALANCE, year))}`}
          />
          <Kpi
            label="Borrowed this year"
            value={formatBn(Math.abs(at(MAIN_BALANCE, year)))}
            hint="Main budget deficit"
          />
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <h2 className="font-display text-2xl text-fg">
          {detailYear != null ? "Tax, instrument by instrument" : "How gross tax splits"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {detailYear != null
            ? "Table 3.1. The fuel levy in 2026/27 is R30.9 billion below the February budget because of the April–June relief."
            : "Annexure C groups. The finer instrument split is only published for 2025/26 and 2026/27."}
        </p>
        <div className="mt-4 space-y-3">
          {detailYear != null
            ? Object.values(TAX_DETAIL).map((item) => {
                const value = detailYear === 0 ? item.y2025 : item.y2026;
                return <BarRow key={item.name} name={item.name} value={value} max={gross} />;
              })
            : lines.map((item) => (
                <BarRow key={item.name} name={item.name} value={at(item.values, year)} max={gross} />
              ))}
        </div>
      </section>
    </div>
  );
}

function Bridge({
  rows,
  totalLabel,
  total,
}: {
  rows: { name: string; value: number }[];
  totalLabel: string;
  total: number;
}) {
  return (
    <div className="mt-4">
      <ul className="divide-y divide-line">
        {rows.map((row) => (
          <li key={row.name} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="text-fg">{row.name}</span>
            <span className="text-brass tabular-nums">{formatBn(row.value)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3">
        <span className="text-fg">{totalLabel}</span>
        <span className="font-display text-2xl text-brass tabular-nums">{formatBn(total)}</span>
      </p>
    </div>
  );
}

function SpheresView({ year }: { year: number }) {
  const rows = SPHERES.map((sphere) => ({ ...sphere, value: at(sphere.values, year) }));
  const sphereTotal = rows.reduce((sum, row) => sum + row.value, 0);
  const showProvinces = year >= 1;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <h2 className="font-display text-2xl text-fg">Division of available funds</h2>
        <p className="mt-1 text-sm text-muted">
          Main budget money before debt-service costs, {YEARS[year].label}. This is who receives
          the allocation. Provinces then spend most of it on schools and hospitals, which is why
          they dominate the function view.
        </p>
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <BarRow key={row.id} name={row.name} value={row.value} max={sphereTotal} />
          ))}
        </div>
        <p className="mt-4 text-sm text-muted tabular-nums">
          These three spheres: {formatBn(sphereTotal)}. Debt service of{" "}
          {formatBn(at(FUNCTIONS.find((f) => f.id === "debt")!.values, year))} sits outside this
          split, on the main budget.
        </p>
      </section>
      <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <h2 className="font-display text-2xl text-fg">Provincial equitable share</h2>
        {showProvinces ? (
          <>
            <p className="mt-1 text-sm text-muted">
              2026/27 Table 4.4, ranked. This is the unconditional transfer, not the full provincial
              budget. Conditional grants sit on top. The formula barely changes the ranking in later
              years, so this one year is the map.
            </p>
            <div className="mt-4 space-y-3">
              {PROVINCIAL_EQ_SHARE.map((province) => (
                <BarRow
                  key={province.name}
                  name={province.name}
                  value={province.m / 1000}
                  max={PROVINCIAL_EQ_SHARE[0].m / 1000}
                />
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">Published total R676.7 billion.</p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">
            The provincial equitable-share table in this statement starts in 2026/27. Switch year to
            see where that pool lands.
          </p>
        )}
      </section>
    </div>
  );
}

function ProjectJump({
  id,
  onOpen,
}: {
  id: string | null;
  onOpen: (sector: ProjectSector | "all") => void;
}) {
  const jump =
    id === "community"
      ? { sector: "water" as const, label: "Open the water projects that are still unfinished" }
      : id === "economic" || id === "infra"
        ? { sector: "all" as const, label: "Open the project file behind this spending" }
        : id === "debt"
          ? { sector: "bailout" as const, label: "See who the bailout money is paid to" }
          : null;
  if (!jump) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(jump.sector)}
      className="mt-4 min-h-11 w-full rounded-xl border border-brass px-3 text-left text-sm text-brass"
    >
      {jump.label}
    </button>
  );
}

function PressureView({ onOpenProjects }: { onOpenProjects: (sector: ProjectSector | "all") => void }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-fg">Where the books don’t close</h2>
      <p className="mt-2 max-w-2xl text-sm text-pretty text-muted">
        Seeing the budget is not the same as seeing it honoured. These are oversight figures.
        They are stocks or prior-year findings. Do not add them to the 2026/27 ring.
      </p>
      <button
        type="button"
        onClick={() => onOpenProjects("all")}
        className="mt-4 min-h-11 rounded-full border border-brass px-4 text-sm text-brass"
      >
        Open the named projects
      </button>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {LEAKS.map((leak) => (
          <li key={leak.id} className="rounded-2xl border border-line bg-panel p-4">
            <p className="text-xs tracking-wide text-muted uppercase">{leak.when}</p>
            <p className="mt-2 font-display text-3xl text-brass">{leak.figure}</p>
            <h3 className="mt-2 text-fg">{leak.title}</h3>
            <p className="mt-2 text-sm text-pretty text-muted">{leak.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
