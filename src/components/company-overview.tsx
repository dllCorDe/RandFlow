import { useEffect, useMemo, useRef, useState } from "react";
import { Focus, Minus, Plus, Scan, ZoomIn } from "lucide-react";
import type { GraphLink, GraphNode } from "@/lib/tenders.functions";
import { awardValue } from "@/lib/award-value";
import { RelationshipLegend } from "@/components/relationship-legend";

type Camera = { x: number; y: number; zoom: number };
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 50;

/** Stable, separated clusters: zoom changes the camera, never the data layout. */
export function CompanyOverview({
  entities,
  jobs,
  links,
  selected,
  onSelect,
  onFocus,
  loadedAll,
}: {
  entities: GraphNode[];
  jobs: GraphNode[];
  links: GraphLink[];
  selected: string | null;
  onSelect: (id: string) => void;
  onFocus: () => void;
  loadedAll?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(0);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [hovered, setHovered] = useState<string | null>(null);
  const layout = useMemo(() => {
    const byId = new Map(jobs.map((job) => [job.id, job]));
    const adjacency = new Map<string, GraphNode[]>();
    for (const link of links) {
      const job = byId.get(link.target);
      if (job) {
        const list = adjacency.get(link.source) ?? [];
        list.push(job);
        adjacency.set(link.source, list);
      }
    }
    const clusters = entities
      .map((entity) => {
        const connected = adjacency.get(entity.id) ?? [];
        const wins =
          entity.entityRole === "buyer"
            ? 0
            : connected.filter(
                (job) => job.status === "Awarded" || job.detail.startsWith("Awarded ·"),
              ).length;
        // Circle area grows with award count. Buyers are deliberately a fixed size.
        const r = entity.entityRole === "buyer" ? 54 : Math.sqrt(48 ** 2 + wins * 1250);
        return { entity, connected, wins, r };
      })
      .sort((a, b) => b.wins - a.wins || a.entity.label.localeCompare(b.entity.label));
    const cell = Math.max(310, ...clusters.map(({ r }) => (r + 75) * 2));
    const columns = Math.max(1, Math.ceil(Math.sqrt(clusters.length * 1.5)));
    const rows = Math.max(1, Math.ceil(clusters.length / columns));
    return {
      width: columns * cell,
      height: rows * cell,
      clusters: clusters.map((cluster, index) => ({
        ...cluster,
        x: ((index % columns) + 0.5) * cell,
        y: (Math.floor(index / columns) + 0.5) * cell,
      })),
    };
  }, [entities, jobs, links]);

  const worldPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(matrix.inverse());
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const anchor = point.matrixTransform(matrix.inverse());
      setCamera((current) => {
        const zoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, current.zoom * Math.exp(-event.deltaY * 0.002)),
        );
        const ratio = current.zoom / zoom;
        return {
          zoom,
          x: anchor.x - (anchor.x - current.x) * ratio,
          y: anchor.y - (anchor.y - current.y) * ratio,
        };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) =>
    setCamera((current) => {
      const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.zoom * factor));
      return {
        zoom,
        x: current.x + layout.width / current.zoom / 2 - layout.width / zoom / 2,
        y: current.y + layout.height / current.zoom / 2 - layout.height / zoom / 2,
      };
    });
  const chosen = layout.clusters.find(({ entity }) => entity.id === selected);
  const emphasis = hovered ?? selected;

  const bubbles = useMemo(
    () => (
      <>
        {layout.clusters.map(({ entity, connected, wins, r, x, y }) => {
          const active = emphasis === entity.id;
          const orbit = r + 37;
          const words = entity.label.split(/\s+/);
          const lines: string[] = [];
          let line = "";
          const max = Math.max(12, Math.floor(r / 4));
          for (const word of words) {
            if (line && `${line} ${word}`.length > max) {
              lines.push(line);
              line = "";
            }
            line = line ? `${line} ${word}` : word;
          }
          if (line) lines.push(line);
          const labels = lines
            .slice(0, 3)
            .map((text, index) =>
              text.length > max || (index === 2 && lines.length > 3)
                ? `${text.slice(0, max - 1)}…`
                : text,
            );
          return (
            <g key={entity.id} className={`overview-cluster ${active ? "is-active" : ""}`}>
              {connected.map((job, index) => {
                const angle = (index / connected.length) * Math.PI * 2 - Math.PI / 2;
                const tx = x + Math.cos(angle) * orbit;
                const ty = y + Math.sin(angle) * orbit;
                return (
                  <g
                    key={job.id}
                    className={`overview-tender ${job.status === "Awarded" ? "awarded" : job.tone === "closed" ? "closed" : "open"}`}
                  >
                    <line x1={x} y1={y} x2={tx} y2={ty} />
                    <circle cx={tx} cy={ty} r={active ? 8 : 6}>
                      <title>
                        {job.label} · {job.status}
                      </title>
                    </circle>
                  </g>
                );
              })}
              <g
                transform={`translate(${x} ${y})`}
                role="button"
                tabIndex={0}
                aria-pressed={selected === entity.id}
                aria-label={`${entity.label}, ${wins} tenders won, ${connected.length} linked tenders`}
                className={`overview-company ${entity.entityRole === "buyer" ? "is-buyer" : ""}`}
                onMouseEnter={() => setHovered(entity.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(entity.id)}
                onBlur={() => setHovered(null)}
                onClick={() => {
                  if (moved.current < 5) onSelect(entity.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelect(entity.id);
                  }
                }}
              >
                <title>
                  {entity.label}: {wins} tenders won in loaded records; {connected.length} linked
                  tenders.
                </title>
                <circle r={r + 7} className="overview-company-halo" />
                <circle r={r} className="overview-company-body" />
                <text
                  className="overview-company-name"
                  fontSize={Math.max(11, Math.min(16, r / 5))}
                >
                  {labels.map((text, index) => (
                    <tspan key={index} x="0" y={-(labels.length - 1) * 8 + index * 16 - 7}>
                      {text}
                    </tspan>
                  ))}
                </text>
                <text
                  className="overview-company-count"
                  y={entity.entityRole === "buyer" ? r * 0.62 : r * 0.42}
                >
                  {entity.entityRole === "buyer"
                    ? `${connected.length} tenders · buyer`
                    : `${wins} won`}
                </text>
                {entity.entityRole !== "buyer" && (
                  <>
                    <text className="overview-award-label" y={r * 0.65}>
                      TOTAL AWARDED
                    </text>
                    <text className="overview-award-value" y={r * 0.85}>
                      <title>
                        {awardValue(entity)}. {entity.missingAwardAmounts ?? 0} award amounts
                        unpublished or unrecognised. Published awards do not confirm payment.
                      </title>
                      {awardValue(entity, true)}
                    </text>
                  </>
                )}
              </g>
            </g>
          );
        })}
      </>
    ),
    [layout, emphasis, selected, onSelect],
  );

  return (
    <section className="company-overview" aria-label="All companies bubble overview">
      <div className="overview-heading">
        <div>
          <span className="canvas-dot" />
          <strong>
            {loadedAll ? "ALL ENTITIES FOR SELECTED FILTERS" : "ALL ENTITIES IN THIS SAMPLE"}
          </strong>
          <span>
            {entities.length} entities · {jobs.length} tenders
          </span>
        </div>
        <RelationshipLegend />
      </div>
      <div className="overview-viewport">
        <svg
          ref={svgRef}
          viewBox={`${camera.x} ${camera.y} ${layout.width / camera.zoom} ${layout.height / camera.zoom}`}
          role="group"
          aria-label="Zoomable company and tender relationships"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            const step = (layout.width / camera.zoom) * 0.1;
            if (
              ["+", "=", "-", "0", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                event.key,
              )
            )
              event.preventDefault();
            if (event.key === "+" || event.key === "=") zoomBy(1.3);
            if (event.key === "-") zoomBy(1 / 1.3);
            if (event.key === "0") setCamera({ x: 0, y: 0, zoom: 1 });
            if (event.key.startsWith("Arrow"))
              setCamera((current) => ({
                ...current,
                x:
                  current.x +
                  (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0),
                y:
                  current.y +
                  (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0),
              }));
          }}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            if (!pointers.current.size) moved.current = 0;
            pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          }}
          onPointerMove={(event) => {
            const previous = pointers.current.get(event.pointerId);
            if (!previous) return;
            const next = { x: event.clientX, y: event.clientY };
            moved.current += Math.hypot(next.x - previous.x, next.y - previous.y);
            if (moved.current > 5) event.currentTarget.setPointerCapture(event.pointerId);
            const other = [...pointers.current.entries()].find(
              ([id]) => id !== event.pointerId,
            )?.[1];
            if (other) {
              const before = Math.hypot(previous.x - other.x, previous.y - other.y);
              const after = Math.hypot(next.x - other.x, next.y - other.y);
              const anchor = worldPoint((next.x + other.x) / 2, (next.y + other.y) / 2);
              if (before > 0 && anchor)
                setCamera((current) => {
                  const zoom = Math.max(
                    MIN_ZOOM,
                    Math.min(MAX_ZOOM, (current.zoom * after) / before),
                  );
                  const ratio = current.zoom / zoom;
                  return {
                    zoom,
                    x: anchor.x - (anchor.x - current.x) * ratio,
                    y: anchor.y - (anchor.y - current.y) * ratio,
                  };
                });
            } else {
              const from = worldPoint(previous.x, previous.y);
              const to = worldPoint(next.x, next.y);
              if (from && to)
                setCamera((current) => ({
                  ...current,
                  x: current.x + from.x - to.x,
                  y: current.y + from.y - to.y,
                }));
            }
            pointers.current.set(event.pointerId, next);
          }}
          onPointerUp={(event) => pointers.current.delete(event.pointerId)}
          onPointerCancel={(event) => pointers.current.delete(event.pointerId)}
          onLostPointerCapture={(event) => pointers.current.delete(event.pointerId)}
        >
          {bubbles}
        </svg>
        <div className="overview-controls" role="group" aria-label="Overview zoom controls">
          <button
            type="button"
            aria-label="Zoom out"
            disabled={camera.zoom <= MIN_ZOOM}
            onClick={() => zoomBy(1 / 1.3)}
          >
            <Minus size={17} />
          </button>
          <output aria-label="Zoom level">{Math.round(camera.zoom * 100)}%</output>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={camera.zoom >= MAX_ZOOM}
            onClick={() => zoomBy(1.3)}
          >
            <Plus size={17} />
          </button>
          <span />
          <button
            type="button"
            aria-label="Fit all companies"
            onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}
          >
            <Scan size={17} />
          </button>
        </div>
        <div className="overview-instructions">
          <ZoomIn size={13} />
          Scroll or pinch to zoom · Drag to pan · Select a company
        </div>
      </div>
      <div className="overview-selection">
        <div>
          <strong>{chosen?.entity.label ?? "Select a company bubble"}</strong>
          <p>
            {chosen
              ? `${chosen.wins} tenders won · ${chosen.connected.length} linked tenders${chosen.entity.entityRole !== "buyer" ? ` · Total awarded: ${awardValue(chosen.entity)}` : ""}${loadedAll ? " · selected province" : " · loaded sample"}`
              : "Explore all companies together, then focus on an individual network."}
          </p>
        </div>
        <button
          type="button"
          disabled={!chosen}
          onClick={() => {
            if (!chosen) return;
            const zoom = Math.max(1, Math.min(MAX_ZOOM, layout.width / (chosen.r * 5)));
            setCamera({
              zoom,
              x: chosen.x - layout.width / zoom / 2,
              y: chosen.y - layout.height / zoom / 2,
            });
          }}
        >
          <ZoomIn size={15} />
          Zoom to company
        </button>
        <button type="button" disabled={!chosen} onClick={onFocus}>
          <Focus size={15} />
          Explore tenders
        </button>
      </div>
    </section>
  );
}
