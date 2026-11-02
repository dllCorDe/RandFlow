import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PROVINCES } from "@/data/provinces";
import { loadLinkGraph, type GraphLink, type GraphNode } from "@/lib/tenders.functions";

type Placed = GraphNode & { x: number; y: number; r: number; phase: number; speed: number };

const WIDTH = 1000;
const HEIGHT = 680;

function hash(id: string): number {
  let value = 0;
  for (let i = 0; i < id.length; i += 1) value = (value * 33 + id.charCodeAt(i)) % 1000;
  return value / 1000;
}

function radiusOf(node: GraphNode): number {
  if (node.kind === "job") return 10;
  return Math.min(88, 42 + Math.sqrt(Math.max(node.degree, 1)) * 20);
}

function drift(node: Placed, t: number): { x: number; y: number } {
  const reach = node.kind === "company" ? 12 : 20;
  return {
    x: node.x + Math.sin(t * node.speed + node.phase) * reach,
    y: node.y + Math.cos(t * node.speed * 0.75 + node.phase * 1.3) * reach * 0.85,
  };
}

function nameLines(label: string, radius: number): { lines: string[]; size: number } {
  const size = Math.max(10, Math.min(15, Math.round(radius / 5.6)));
  const max = Math.max(6, Math.floor((radius * 1.35) / (size * 0.56)));
  const chunks = label
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => {
      if (word.length <= max) return [word];
      const parts: string[] = [];
      for (let i = 0; i < word.length && parts.length < 3; i += max) parts.push(word.slice(i, i + max));
      return parts;
    });
  const lines: string[] = [];
  let current = "";
  for (const piece of chunks) {
    const next = current ? `${current} ${piece}` : piece;
    if (next.length > max && current) {
      lines.push(current);
      current = piece;
    } else {
      current = next;
    }
    if (lines.length === 3) break;
  }
  if (current && lines.length < 3) lines.push(current);
  return { lines: lines.slice(0, 3), size };
}

function place(nodes: GraphNode[], links: GraphLink[]): Placed[] {
  const placed: Placed[] = nodes.map((node, index) => {
    const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2;
    const ring = node.kind === "company" ? 0.18 : 0.38;
    const spin = hash(node.id);
    return {
      ...node,
      x: WIDTH / 2 + Math.cos(angle) * WIDTH * ring,
      y: HEIGHT / 2 + Math.sin(angle) * HEIGHT * ring,
      r: radiusOf(node),
      phase: spin * Math.PI * 2,
      speed: 0.28 + spin * 0.35,
    };
  });
  const byId = new Map(placed.map((node) => [node.id, node]));
  for (let step = 0; step < 180; step += 1) {
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const a = placed[i];
        const b = placed[j];
        const dx = b.x - a.x || 0.1;
        const dy = b.y - a.y || 0.1;
        const dist = Math.hypot(dx, dy) || 0.1;
        const min = a.r + b.r + 14;
        const push = dist < min ? (min - dist) / dist : 90 / (dist * dist);
        a.x -= dx * push * 0.42;
        a.y -= dy * push * 0.42;
        b.x += dx * push * 0.42;
        b.y += dy * push * 0.42;
      }
    }
    for (const link of links) {
      const a = byId.get(link.source);
      const b = byId.get(link.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      a.x += dx * 0.012;
      a.y += dy * 0.012;
      b.x -= dx * 0.012;
      b.y -= dy * 0.012;
    }
    for (const node of placed) {
      node.x += (WIDTH / 2 - node.x) * 0.012;
      node.y += (HEIGHT / 2 - node.y) * 0.012;
      node.x = Math.min(WIDTH - node.r - 8, Math.max(node.r + 8, node.x));
      node.y = Math.min(HEIGHT - node.r - 8, Math.max(node.r + 8, node.y));
    }
  }
  return placed;
}

export function LinkChart() {
  const [province, setProvince] = useState("");
  const [company, setCompany] = useState("");
  const [needle, setNeedle] = useState("");
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setNeedle(company.trim()), 400);
    return () => clearTimeout(handle);
  }, [company]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadLinkGraph({ data: { company: needle.length >= 2 ? needle : "", province } })
      .then((graph) => {
        if (cancelled) return;
        setNodes(graph.nodes);
        setLinks(graph.links);
        setSelected(null);
      })
      .catch(() => {
        if (cancelled) return;
        setNodes([]);
        setLinks([]);
        setError("Treasury’s tender site did not answer. Try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [needle, province]);

  const placed = useMemo(() => place(nodes, links), [nodes, links]);
  const byId = useMemo(() => new Map(placed.map((node) => [node.id, node])), [placed]);
  const active = placed.find((node) => node.id === selected) ?? null;
  const linked = new Set(
    active
      ? links.flatMap((link) =>
          link.source === active.id ? [link.target] : link.target === active.id ? [link.source] : [],
        )
      : [],
  );
  const nodeEls = useRef(new Map<string, SVGGElement>());
  const lineEls = useRef(new Map<string, SVGLineElement>());

  useEffect(() => {
    if (placed.length === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let frame = 0;
    const origin = performance.now();
    const step = (now: number) => {
      const t = (now - origin) / 1000;
      const pos = new Map<string, { x: number; y: number }>();
      for (const node of placed) {
        const point = drift(node, t);
        pos.set(node.id, point);
        nodeEls.current.get(node.id)?.setAttribute("transform", `translate(${point.x} ${point.y})`);
      }
      for (const link of links) {
        const a = pos.get(link.source);
        const b = pos.get(link.target);
        const line = lineEls.current.get(`${link.source}-${link.target}`);
        if (!a || !b || !line) continue;
        line.setAttribute("x1", String(a.x));
        line.setAttribute("y1", String(a.y));
        line.setAttribute("x2", String(b.x));
        line.setAttribute("y2", String(b.y));
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [placed, links]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="border-b border-line pb-6">
        <p className="text-xs tracking-[0.18em] text-brass uppercase">Randflow</p>
        <h1 className="mt-2 font-display text-4xl text-balance text-fg sm:text-5xl">Who is tied to the work</h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted">
          Companies are the large bubbles, and the name sits inside. A company with more jobs is
          bigger. The small bubbles are the jobs, joined by a line. Green means awarded or still
          open. Black means closed. A closed job with no winner hangs off the department that asked
          for the work.
        </p>
        <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-sm text-brass">
          Back to the budget
        </Link>
      </header>

      <div className="mt-6 flex flex-col gap-3">
        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="A company name, such as DI GRAZIA"
            className="min-h-11 w-full rounded-xl border border-line bg-panel pr-3 pl-9 text-fg"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Province">
          {PROVINCES.map((item) => (
            <button
              key={item.id || "all"}
              type="button"
              onClick={() => setProvince(item.id)}
              className={
                "min-h-11 shrink-0 rounded-full border px-3 text-sm " +
                (province === item.id ? "border-brass bg-brass text-brass-ink" : "border-line text-fg")
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#1b7a43]" /> Awarded or still open
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#161616]" /> Closed
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full border border-line bg-[#f7f4ec]" /> Company or department
        </span>
      </div>

      {error && <p className="mt-4 text-sm text-brass">{error}</p>}
      {loading && <p className="mt-4 text-sm text-muted">Drawing the links…</p>}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)]">
        <div className="overflow-hidden rounded-2xl border border-line bg-[#f4f0e6]">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Company and job links" className="h-auto w-full">
            {links.map((link) => {
              const a = byId.get(link.source);
              const b = byId.get(link.target);
              if (!a || !b) return null;
              const dim = active && link.source !== active.id && link.target !== active.id;
              return (
                <line
                  key={`${link.source}-${link.target}`}
                  ref={(el) => {
                    const key = `${link.source}-${link.target}`;
                    if (el) lineEls.current.set(key, el);
                    else lineEls.current.delete(key);
                  }}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={link.tone === "live" ? "#1b7a43" : "#161616"}
                  strokeWidth={dim ? 1 : 2}
                  opacity={dim ? 0.15 : 0.85}
                />
              );
            })}
            {placed.map((node) => {
              const on = node.id === selected || linked.has(node.id);
              const fill = node.tone === "live" ? "#1b7a43" : node.tone === "closed" ? "#161616" : "#f7f4ec";
              const label = node.kind === "company" ? nameLines(node.label, node.r) : null;
              return (
                <g
                  key={node.id}
                  ref={(el) => {
                    if (el) nodeEls.current.set(node.id, el);
                    else nodeEls.current.delete(node.id);
                  }}
                  transform={`translate(${node.x} ${node.y})`}
                  onClick={() => setSelected(node.id)}
                  className="cursor-pointer"
                >
                  <title>
                    {node.label}. {node.detail}
                  </title>
                  <circle
                    r={node.r}
                    fill={fill}
                    stroke={on ? "#8a6a24" : node.kind === "company" ? "#243028" : "none"}
                    strokeWidth={on ? 4 : 1.5}
                  />
                  {label && (
                    <>
                      <clipPath id={`clip-${node.id}`}>
                        <circle r={node.r - 6} />
                      </clipPath>
                      <text
                        y={4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#14201b"
                        fontSize={label.size}
                        fontFamily="Outfit, sans-serif"
                        clipPath={`url(#clip-${node.id})`}
                      >
                      {label.lines.map((line, index) => (
                        <tspan
                          key={`${node.id}-${index}`}
                          x={0}
                          dy={index === 0 ? `${-((label.lines.length - 1) * 1.15) / 2}em` : "1.15em"}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          {!loading && placed.length === 0 && (
            <p className="px-4 pb-6 text-sm text-[#14201b]">Nothing in this slice to draw.</p>
          )}
        </div>
        <aside className="rounded-2xl border border-line bg-panel p-4">
          {active ? (
            <>
              <p className="text-xs tracking-wide text-brass uppercase">
                {active.kind === "company" ? "Bubble" : active.tone === "live" ? "Green job" : "Black job"}
              </p>
              <h2 className="mt-1 font-display text-2xl text-balance text-fg">{active.label}</h2>
              <p className="mt-3 text-sm text-pretty text-fg">{active.detail}</p>
              {active.kind === "company" && (
                <p className="mt-3 text-sm text-muted">{active.degree} linked job{active.degree === 1 ? "" : "s"} in this drawing.</p>
              )}
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl text-fg">Pick a bubble</h2>
              <p className="mt-2 text-sm text-pretty text-muted">
                This drawing is a slice, about thirty jobs, not every tender in the country. Search
                a company to pull the jobs Treasury ties to that name.
              </p>
            </>
          )}
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {placed
              .filter((node) => node.kind === "job")
              .map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(node.id)}
                    className={
                      "w-full rounded-xl border px-3 py-2 text-left text-sm " +
                      (selected === node.id ? "border-brass bg-raised" : "border-line")
                    }
                  >
                    <span className={node.tone === "live" ? "text-[#8dcea8]" : "text-fg"}>{node.label}</span>
                    <span className="mt-1 block text-muted">{node.tone === "live" ? "Awarded or open" : "Closed"}</span>
                  </button>
                </li>
              ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
