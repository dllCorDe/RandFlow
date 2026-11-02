import { useDeferredValue, useEffect, useId, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  ArrowDownLeft,
  ArrowLeft,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  FileText,
  Landmark,
  List,
  MapPin,
  Network,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { PROVINCES } from "@/data/provinces";
import { CompanyOverview } from "@/components/company-overview";
import { CompanyTenders } from "@/components/company-tenders";
import { TenderSourceLink } from "@/components/tender-source-link";
import { awardValue } from "@/lib/award-value";
import { RelationshipLegend } from "@/components/relationship-legend";
import { RelationshipFilters } from "@/components/relationship-filters";
import {
  matchesEntityFilters,
  supplierWins,
  DEFAULT_ENTITY_FILTERS,
  type EntityFilters,
} from "@/lib/entity-filters";
import { loadLinkGraph, type GraphNode, type LinkGraph } from "@/lib/tenders.functions";

const PAGE_SIZE = 8;
type StatusFilter = "all" | "awarded" | "open" | "closed";

function statusOf(node: GraphNode): string {
  return node.status || node.detail.split(" · ")[0] || "Not published";
}

function statusClass(node: GraphNode): string {
  return statusOf(node).toLowerCase() === "awarded"
    ? "awarded"
    : node.tone === "closed"
      ? "closed"
      : "open";
}

function shortLines(value: string, limit = 20, count = 3): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(/\s+/)) {
    if (line && `${line} ${word}`.length > limit) {
      lines.push(line);
      line = "";
    }
    line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines
    .slice(0, count)
    .map((text, index) =>
      text.length > limit || (index === count - 1 && lines.length > count)
        ? `${text.slice(0, limit - 1)}…`
        : text,
    );
}

function StatusBadge({ node }: { node: GraphNode }) {
  return (
    <span className={`relationship-badge ${statusClass(node)}`}>
      <span />
      {statusOf(node)}
    </span>
  );
}

function RelationshipMap({
  entity,
  jobs,
  selected,
  onSelect,
}: {
  entity: GraphNode;
  jobs: GraphNode[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const highlight = hovered ?? selected;
  const name = shortLines(entity.label, 19, 4);
  const points = jobs.map((job, index) => {
    const angle = ((-90 + (360 / Math.max(jobs.length, 3)) * index) * Math.PI) / 180;
    return { job, x: 390 + Math.cos(angle) * 242, y: 300 + Math.sin(angle) * 200 };
  });
  return (
    <svg
      className="relationship-map"
      viewBox="0 0 780 610"
      role="group"
      aria-label={`Tender relationships for ${entity.label}`}
    >
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor="#c9ad6a" stopOpacity=".1" />
          <stop offset="100%" stopColor="#c9ad6a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="390" cy="300" r="285" fill={`url(#${gradientId})`} />
      <ellipse cx="390" cy="300" rx="242" ry="200" className="relationship-orbit" />
      <ellipse cx="390" cy="300" rx="143" ry="118" className="relationship-orbit inner" />
      {points.map(({ job, x, y }, index) => {
        const active = highlight === job.id;
        const path = `M 390 300 Q ${390 + (x - 390) * 0.65} ${300 + (y - 300) * 0.1} ${x} ${y}`;
        return (
          <g
            key={job.id}
            className={`relationship-edge ${statusClass(job)} ${active ? "is-active" : ""} ${highlight && !active ? "is-muted" : ""}`}
            aria-hidden="true"
          >
            <motion.path
              d={path}
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 0.45,
                delay: reduceMotion ? 0 : index * 0.035,
              }}
            />
            {active && <path d={path} className="relationship-beam" />}
          </g>
        );
      })}
      <g className="relationship-hub" transform="translate(390 300)">
        <circle r="108" className="hub-halo" />
        <circle r="96" className="hub-body" />
        <text y={-55} className="hub-eyebrow">
          {entity.entityRole === "buyer" ? "PUBLIC BUYER" : "SUPPLIER"}
        </text>
        <text className="hub-name">
          {name.map((line, index) => (
            <tspan key={index} x="0" y={-22 + index * 19}>
              {line}
            </tspan>
          ))}
        </text>
        <text y="72" className="hub-count">
          {entity.entityRole === "buyer"
            ? `${jobs.length} visible tenders`
            : `Total awarded: ${awardValue(entity, true)}`}
        </text>
      </g>
      {points.map(({ job, x, y }, index) => {
        const active = highlight === job.id;
        const label = shortLines(job.label, 21, 2);
        return (
          <g
            key={job.id}
            transform={`translate(${x} ${y})`}
            className={`relationship-node ${statusClass(job)} ${active ? "is-active" : ""} ${highlight && !active ? "is-muted" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={`${job.label}, ${statusOf(job)}`}
            aria-pressed={selected === job.id}
            onClick={() => onSelect(job.id)}
            onMouseEnter={() => setHovered(job.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(job.id)}
            onBlur={() => setHovered(null)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(job.id);
              }
            }}
          >
            <title>
              {job.label}. {job.detail}
            </title>
            <rect x="-90" y="-30" width="180" height="125" fill="transparent" />
            <motion.circle
              initial={false}
              animate={{ r: active ? 31 : 27 }}
              transition={
                reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 24 }
              }
              className="node-halo"
            />
            <circle r="21" className="node-body" />
            <text y="5" className="node-number">
              {String(index + 1).padStart(2, "0")}
            </text>
            <rect x="-90" y="34" width="180" height="58" rx="9" className="node-label-bg" />
            <text className="node-label">
              {label.map((line, i) => (
                <tspan key={i} x="0" y={51 + i * 15}>
                  {line}
                </tspan>
              ))}
            </text>
            <text y={label.length > 1 ? 83 : 70} className="node-status">
              {statusOf(job)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function LinkChart() {
  const reduceMotion = useReducedMotion();
  const motionScope = useId();
  const [province, setProvince] = useState("");
  const [allProvince, setAllProvince] = useState(false);
  const [company, setCompany] = useState("");
  const [needle, setNeedle] = useState("");
  const [graph, setGraph] = useState<LinkGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<"overview" | "map" | "list">("overview");
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [entityFilters, setEntityFilters] = useState<EntityFilters>(DEFAULT_ENTITY_FILTERS);
  const deferredFilters = useDeferredValue(entityFilters);

  useEffect(() => {
    const handle = setTimeout(() => setNeedle(company.trim()), 400);
    return () => clearTimeout(handle);
  }, [company]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setGraph(null);
    loadLinkGraph({
      data: { company: needle.length >= 2 ? needle : "", province, all: allProvince },
    })
      .then((result) => {
        if (cancelled) return;
        setGraph(result);
        setEntityFilters((current) => ({ ...current, amount: null, wins: null }));
        const first = result.nodes
          .filter((node) => node.kind === "company")
          .sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label))[0];
        setEntityId(first?.id ?? null);
        setSelected(null);
        setPage(0);
      })
      .catch(() => {
        if (!cancelled) setError("We couldn’t reach Treasury’s tender service. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [needle, province, retry, allProvince]);

  const allEntities = useMemo(
    () =>
      (graph?.nodes ?? [])
        .filter((node) => node.kind === "company")
        .sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label)),
    [graph],
  );
  const allJobs = useMemo(
    () => (graph?.nodes ?? []).filter((node) => node.kind === "job"),
    [graph],
  );
  const winCounts = useMemo(() => supplierWins(allJobs, graph?.links ?? []), [allJobs, graph]);
  const maxAmount = useMemo(
    () =>
      allEntities.reduce(
        (max, node) =>
          node.entityRole === "buyer"
            ? max
            : Math.max(
                max,
                Math.min(Number.MAX_SAFE_INTEGER, Number(node.totalAwardedCents ?? "0")),
              ),
        0,
      ),
    [allEntities],
  );
  const maxWins = useMemo(
    () =>
      allEntities.reduce(
        (max, node) =>
          node.entityRole === "buyer" ? max : Math.max(max, winCounts.get(node.id) ?? 0),
        0,
      ),
    [allEntities, winCounts],
  );
  const entities = useMemo(
    () =>
      allEntities.filter((node) =>
        matchesEntityFilters(node, winCounts.get(node.id) ?? 0, deferredFilters, maxAmount),
      ),
    [allEntities, winCounts, deferredFilters, maxAmount],
  );
  const jobs = useMemo(() => {
    const ids = new Set(entities.map((node) => node.id));
    const connected = new Set(
      (graph?.links ?? []).filter((link) => ids.has(link.source)).map((link) => link.target),
    );
    return allJobs.filter((node) => connected.has(node.id));
  }, [allJobs, entities, graph]);
  const entity = entities.find((node) => node.id === entityId) ?? entities[0];
  const effectiveEntityId = entity?.id;
  const relatedIds = new Set(
    (graph?.links ?? [])
      .filter((link) => link.source === effectiveEntityId || link.target === effectiveEntityId)
      .flatMap((link) => [link.source, link.target]),
  );
  const related = jobs.filter((node) => relatedIds.has(node.id));
  const filtered = related.filter((node) => filter === "all" || statusClass(node) === filter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const active = filtered.find((node) => node.id === selected);
  const suppliers = entities.filter((node) => node.entityRole !== "buyer").length;
  const buyers = entities.length - suppliers;
  const chooseEntity = (id: string) => {
    setEntityId(id);
    setSelected(null);
    setPage(0);
  };
  const changeFilter = (value: StatusFilter) => {
    setFilter(value);
    setSelected(null);
    setPage(0);
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="relationships mx-auto w-full max-w-[1480px] px-4 pb-10 sm:px-8">
        <nav className="relationship-nav" aria-label="Main navigation">
          <Link to="/" className="relationship-brand">
            <span className="brand-mark">
              <Network size={18} />
            </span>
            Randflow
            <span className="brand-divider" />
            <span className="brand-tagline">Public money, connected.</span>
          </Link>
          <Link to="/" className="relationship-back">
            <ArrowLeft size={15} />
            Budget dashboard
          </Link>
        </nav>
        <header className="relationship-header">
          <div>
            <p className="relationship-eyebrow">
              <span />
              THE PROCUREMENT EXPLORER
            </p>
            <h1>
              Follow the connections<span>.</span>
            </h1>
            <p>From public buyers to suppliers. See who’s connected to each tender.</p>
          </div>
          <span className="relationship-source">
            <Landmark size={15} />
            National Treasury · eTenders
          </span>
        </header>
        <section className="relationship-stats" aria-label="Records in the current view">
          {[
            {
              label: "Suppliers",
              value: suppliers,
              icon: Building2,
              detail: "with a published award",
            },
            {
              label: "Public buyers",
              value: buyers,
              icon: Landmark,
              detail: "where no winner is published",
            },
            {
              label: "Tenders in this view",
              value: jobs.length,
              icon: FileText,
              detail: graph?.loadedAll
                ? "all available records for selected filters"
                : "loaded records, not the full register",
            },
          ].map(({ label, value, icon: Icon, detail }) => (
            <div className="relationship-stat" key={label}>
              <span className="stat-icon">
                <Icon size={19} />
              </span>
              <div>
                <p>{label}</p>
                <strong>{loading ? "—" : value}</strong>
                <span>{detail}</span>
              </div>
            </div>
          ))}
        </section>
        <section className="relationship-workspace" aria-label="Tender relationship explorer">
          <div className="relationship-toolbar">
            <label className="relationship-search">
              <Search size={17} />
              <span className="sr-only">Search eTenders by company name</span>
              <input
                aria-label="Search eTenders by company name"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Search a company name…"
              />
              {company && (
                <button
                  type="button"
                  aria-label="Clear company search"
                  onClick={() => setCompany("")}
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <label className="relationship-province">
              <MapPin size={15} />
              <span className="sr-only">Province</span>
              <select value={province} onChange={(event) => setProvince(event.target.value)}>
                {PROVINCES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="relationship-refresh"
              disabled={loading}
              onClick={() => setRetry((value) => value + 1)}
              aria-label="Refresh tender data"
            >
              <RefreshCw size={16} className={loading ? "is-spinning" : ""} />
            </button>
          </div>
          {!loading && graph && (
            <RelationshipFilters
              filters={entityFilters}
              maxAmount={maxAmount}
              maxWins={maxWins}
              showing={entities.length}
              total={allEntities.length}
              onChange={(next) => {
                setEntityFilters(next);
                setSelected(null);
                setPage(0);
              }}
            />
          )}
          {province && (
            <label className="province-load-all">
              <input
                type="checkbox"
                checked={allProvince}
                onChange={(event) => {
                  setAllProvince(event.target.checked);
                  setView("overview");
                }}
              />
              Load all companies and tenders for this province
              <span>Reads every available page; larger provinces may take longer.</span>
            </label>
          )}
          {graph?.loadedAll && (
            <p className="relationship-warning" role="status">
              All available records loaded for the selected filters:{" "}
              {allJobs.length.toLocaleString("en-ZA")} tenders. Totals are published award values,
              not confirmed payments.
            </p>
          )}
          {graph?.partial && (
            <p className="relationship-warning" role="status">
              Some pages or tender statuses could not be loaded. This view is incomplete; totals
              cover loaded records only. Use refresh to try again.
            </p>
          )}
          {loading ? (
            <div className="relationship-loading" role="status">
              <div className="loading-network">
                <Network size={32} />
              </div>
              <h2>Connecting the dots</h2>
              <p>
                {allProvince && province
                  ? "Reading all tender pages for this province. This may take a few minutes…"
                  : "Reading the latest tender records from Treasury…"}
              </p>
              <div className="loading-bars">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : error ? (
            <div className="relationship-empty" role="alert">
              <Network size={32} />
              <h2>The connection was interrupted</h2>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
                className="relationship-action"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          ) : !entities.length ? (
            <div className="relationship-empty">
              <Search size={30} />
              <h2>
                {allEntities.length ? "No entities match these filters" : "No connections found"}
              </h2>
              <p>
                {allEntities.length
                  ? "Adjust the ranges or enable buyers or suppliers."
                  : "Try another company name or choose a different province."}
              </p>
              <button
                type="button"
                className="relationship-action"
                onClick={() => {
                  if (allEntities.length) setEntityFilters(DEFAULT_ENTITY_FILTERS);
                  else {
                    setCompany("");
                    setProvince("");
                  }
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className={`relationship-body ${view === "overview" ? "overview-mode" : ""}`}>
              <aside className="relationship-directory" aria-label="Companies and public buyers">
                <div className="directory-heading">
                  <h2>Entities</h2>
                  <span>{entities.length}</span>
                </div>
                <p className="directory-help">Choose one to trace its tenders.</p>
                <div className="entity-list">
                  {entities.map((item) => (
                    <motion.button
                      type="button"
                      key={item.id}
                      whileHover={reduceMotion ? undefined : { x: 2 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className={`entity-item ${item.id === effectiveEntityId ? "is-selected" : ""}`}
                      aria-pressed={item.id === effectiveEntityId}
                      onClick={() => chooseEntity(item.id)}
                    >
                      {item.id === effectiveEntityId && (
                        <motion.span
                          layoutId={`entity-rail-${motionScope}`}
                          className="entity-selection-rail"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 380, damping: 32 }
                          }
                        />
                      )}
                      <span className="entity-icon">
                        {item.entityRole === "buyer" ? (
                          <Landmark size={16} />
                        ) : (
                          <Building2 size={16} />
                        )}
                      </span>
                      <span className="entity-copy">
                        <strong>{item.label}</strong>
                        <span>
                          {item.entityRole === "buyer" ? "Public buyer" : "Supplier"} ·{" "}
                          {item.degree} tender{item.degree === 1 ? "" : "s"}
                        </span>
                      </span>
                      <ChevronRight size={14} />
                    </motion.button>
                  ))}
                </div>
                <div className="directory-note">
                  <CircleDot size={15} />
                  <p>Connections show published tender relationships, not company ownership.</p>
                </div>
              </aside>
              <div className="relationship-content">
                <div className="map-heading">
                  <div>
                    <p className="relationship-eyebrow">
                      {view === "overview"
                        ? "THE BIG PICTURE"
                        : entity?.entityRole === "buyer"
                          ? "PUBLIC BUYER"
                          : "SUPPLIER NETWORK"}
                    </p>
                    <h2>
                      {view === "overview" ? "Every company. One connected view." : entity?.label}
                    </h2>
                  </div>
                  <div className="relationship-view-toggle" role="group" aria-label="Display mode">
                    <button
                      type="button"
                      aria-pressed={view === "overview"}
                      onClick={() => setView("overview")}
                    >
                      {view === "overview" && (
                        <motion.span
                          layoutId={`view-pill-${motionScope}`}
                          className="relationship-view-pill"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 420, damping: 32 }
                          }
                        />
                      )}
                      <Network size={15} />
                      All companies
                    </button>
                    <button
                      type="button"
                      aria-pressed={view === "map"}
                      onClick={() => setView("map")}
                    >
                      {view === "map" && (
                        <motion.span
                          layoutId={`view-pill-${motionScope}`}
                          className="relationship-view-pill"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 420, damping: 32 }
                          }
                        />
                      )}
                      <Network size={15} />
                      Company
                    </button>
                    <button
                      type="button"
                      aria-pressed={view === "list"}
                      onClick={() => setView("list")}
                    >
                      {view === "list" && (
                        <motion.span
                          layoutId={`view-pill-${motionScope}`}
                          className="relationship-view-pill"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 420, damping: 32 }
                          }
                        />
                      )}
                      <List size={15} />
                      List
                    </button>
                  </div>
                </div>
                {view !== "overview" && (
                  <div className="relationship-filters" role="group" aria-label="Tender status">
                    {(["all", "awarded", "open", "closed"] as const).map((value) => (
                      <button
                        type="button"
                        key={value}
                        aria-pressed={filter === value}
                        onClick={() => changeFilter(value)}
                      >
                        {value === "all"
                          ? "All tenders"
                          : value === "open"
                            ? "Open / in progress"
                            : value[0].toUpperCase() + value.slice(1)}
                        <span>
                          {
                            related.filter((node) => value === "all" || statusClass(node) === value)
                              .length
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {view === "overview" ? (
                  <CompanyOverview
                    key={`${needle}-${province}-${retry}-${JSON.stringify(deferredFilters)}`}
                    entities={entities}
                    jobs={jobs}
                    loadedAll={graph?.loadedAll}
                    links={graph?.links ?? []}
                    selected={effectiveEntityId ?? null}
                    onSelect={chooseEntity}
                    onFocus={() => {
                      changeFilter("all");
                      setView("map");
                    }}
                  />
                ) : filtered.length === 0 ? (
                  <div className="relationship-empty">
                    <FileText size={30} />
                    <h2>No tenders with this status</h2>
                    <p>Choose another status to see this entity’s connections.</p>
                    <button
                      className="relationship-action"
                      type="button"
                      onClick={() => changeFilter("all")}
                    >
                      Show all tenders
                    </button>
                  </div>
                ) : (
                  <motion.div
                    key={`${entityId}-${view}-${page}-${filter}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.24 }}
                    className={`relationship-stage ${view === "list" ? "list-view" : ""}`}
                  >
                    {view === "map" && entity && (
                      <div className="relationship-canvas">
                        <div className="canvas-caption">
                          <span className="canvas-dot" />
                          FOCUSED NETWORK<span>Hover to trace · Select to inspect</span>
                        </div>
                        <RelationshipMap
                          key={`${entity.id}-${page}`}
                          entity={entity}
                          jobs={visible}
                          selected={selected}
                          onSelect={setSelected}
                        />
                        <div className="map-legend">
                          <RelationshipLegend />
                          <span>
                            <i className="awarded" />
                            Awarded
                          </span>
                          <span>
                            <i className="open" />
                            Open / in progress
                          </span>
                          <span>
                            <i className="closed" />
                            Closed
                          </span>
                        </div>
                      </div>
                    )}
                    <aside className="relationship-inspector" aria-label="Connected tenders">
                      <div className="inspector-heading">
                        <span className="inspector-icon">
                          <ArrowDownLeft size={17} />
                        </span>
                        <div>
                          <h3>Connected tenders</h3>
                          <p>
                            {filtered.length} for this{" "}
                            {entity?.entityRole === "buyer" ? "buyer" : "supplier"}
                          </p>
                        </div>
                      </div>
                      <div className="tender-connection-list">
                        {visible.map((job, index) => (
                          <motion.button
                            type="button"
                            key={job.id}
                            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                            onClick={() => setSelected(job.id)}
                            className={`tender-connection ${selected === job.id ? "is-selected" : ""}`}
                            aria-pressed={selected === job.id}
                          >
                            <span className="tender-index">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span>
                              <strong>{job.label}</strong>
                              <StatusBadge node={job} />
                            </span>
                            {selected === job.id && <Check size={14} />}
                          </motion.button>
                        ))}
                      </div>
                      <AnimatePresence mode="wait" initial={false}>
                        {active ? (
                          <motion.div
                            className="tender-detail"
                            key={active.id}
                            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                            transition={{ duration: reduceMotion ? 0 : 0.16 }}
                          >
                            <p className="relationship-eyebrow">TENDER DETAILS</p>
                            <h3>{active.label}</h3>
                            <p>{active.detail}</p>
                            <TenderSourceLink
                              id={active.tenderId}
                              status={active.status}
                              number={active.label}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="hint"
                            className="inspector-hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.12 }}
                          >
                            <CircleDot size={20} />
                            <h3>Every connection has a story</h3>
                            <p>
                              Select a numbered tender on the map or in this list to see its
                              details.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </aside>
                  </motion.div>
                )}
                {view !== "overview" && (
                  <div className="relationship-map-footer">
                    <span>
                      {filtered.length
                        ? `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length} linked tenders`
                        : "0 linked tenders"}
                    </span>
                    <div>
                      <button
                        type="button"
                        aria-label="Previous tender page"
                        disabled={page === 0}
                        onClick={() => {
                          setPage((value) => value - 1);
                          setSelected(null);
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span>
                        {page + 1} / {pageCount}
                      </span>
                      <button
                        type="button"
                        aria-label="Next tender page"
                        disabled={page + 1 >= pageCount}
                        onClick={() => {
                          setPage((value) => value + 1);
                          setSelected(null);
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
        {!loading && !error && entity && (
          <CompanyTenders
            key={entity.id}
            entity={entity}
            jobs={related}
            incomplete={graph?.partial}
          />
        )}
        <footer className="relationship-footer">
          <span>
            <Landmark size={14} />
            Sourced from National Treasury’s eTenders portal
          </span>
          <p>
            {graph?.loadedAll
              ? "All available published records for the selected filters."
              : "Totals cover loaded published records only."}{" "}
            An award does not confirm payment or completed work.
          </p>
        </footer>
      </main>
    </MotionConfig>
  );
}
