import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PROVINCES } from "@/data/provinces";
import {
  PROJECTS,
  SECTORS,
  STATUSES,
  type Project,
  type ProjectSector,
  type ProjectStatus,
} from "@/data/projects";
import { TenderRegister } from "@/components/tender-register";

export function ProjectsView({
  sector,
  onSector,
}: {
  sector: ProjectSector | "all";
  onSector: (sector: ProjectSector | "all") => void;
}) {
  const [mode, setMode] = useState<"register" | "cases">(sector === "all" ? "register" : "cases");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [province, setProvince] = useState("All provinces");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (sector !== "all") setMode("cases");
  }, [sector]);

  const needle = query.trim().toLowerCase();
  const rows = useMemo(() => {
    return PROJECTS.filter((project) => {
      if (sector !== "all" && project.sector !== sector) return false;
      if (status !== "all" && project.status !== status) return false;
      if (province !== "All provinces" && project.province !== province) return false;
      if (!needle) return true;
      const hay = [project.name, project.place, project.province, project.plain, ...project.who.map((w) => w.name)]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [sector, status, province, needle]);

  const open = rows.find((project) => project.id === openId) ?? null;

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto" role="group" aria-label="Project source">
        <ModeChip on={mode === "register"} label="Live tender register" onClick={() => setMode("register")} />
        <ModeChip on={mode === "cases"} label="Investigated cases" onClick={() => setMode("cases")} />
      </div>
      {mode === "register" ? (
        <TenderRegister />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
            <h2 className="font-display text-2xl text-fg">Investigated cases</h2>
            <p className="mt-2 text-sm text-pretty text-muted">
              These are the jobs with a public finding behind them: an audit, a court case or a
              Treasury line. The live register next door is the full tender list. This shelf is
              the ones already shown to have gone wrong.
            </p>
            <label className="relative mt-4 block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a place, company or project"
                className="min-h-11 w-full rounded-xl border border-line bg-ink pr-3 pl-9 text-fg"
              />
            </label>
            <div className="mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Province">
              {PROVINCES.map((item) => (
                <FilterChip
                  key={item.label}
                  on={province === item.label}
                  label={item.label}
                  onClick={() => setProvince(item.label)}
                />
              ))}
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto" role="group" aria-label="Project type">
              {SECTORS.map((item) => (
                <FilterChip key={item.id} on={sector === item.id} label={item.label} onClick={() => onSector(item.id)} />
              ))}
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto" role="group" aria-label="What happened">
              {STATUSES.map((item) => (
                <FilterChip key={item.id} on={status === item.id} label={item.label} onClick={() => setStatus(item.id)} />
              ))}
            </div>
            <ul className="mt-4 space-y-2">
              {rows.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(project.id)}
                    className={
                      "w-full rounded-xl border px-3 py-3 text-left " +
                      (openId === project.id ? "border-brass bg-raised" : "border-line bg-ink")
                    }
                  >
                    <span className="text-xs tracking-wide text-brass uppercase">
                      {project.statusLabel} · {project.province}
                    </span>
                    <span className="mt-1 block text-fg">{project.name}</span>
                    <span className="mt-1 block text-sm text-muted">{project.place}</span>
                  </button>
                </li>
              ))}
              {rows.length === 0 && (
                <li className="px-1 py-6 text-sm text-muted">No investigated case in that province.</li>
              )}
            </ul>
          </section>
          <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
            {open ? <ProjectStory project={open} /> : <EmptyStory />}
          </section>
        </div>
      )}
    </div>
  );
}

function ModeChip({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "min-h-11 shrink-0 rounded-full border px-4 text-sm " +
        (on ? "border-brass bg-brass text-brass-ink" : "border-line text-fg")
      }
    >
      {label}
    </button>
  );
}

function FilterChip({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "min-h-11 shrink-0 rounded-full border px-3 text-sm " +
        (on ? "border-brass bg-brass text-brass-ink" : "border-line text-fg")
      }
    >
      {label}
    </button>
  );
}

function EmptyStory() {
  return (
    <div>
      <h2 className="font-display text-2xl text-fg">Pick a job</h2>
      <p className="mt-2 text-sm text-pretty text-muted">
        Each card answers four questions. What was promised. What was spent. Who received the
        money. What the public actually got.
      </p>
    </div>
  );
}

function ProjectStory({ project }: { project: Project }) {
  return (
    <article>
      <p className="text-xs tracking-wide text-brass uppercase">
        {project.statusLabel} · {project.province}
      </p>
      <h2 className="mt-1 font-display text-3xl text-balance text-fg">{project.name}</h2>
      <p className="mt-1 text-sm text-muted">{project.place}</p>
      <p className="mt-4 text-pretty text-fg">{project.plain}</p>
      <dl className="mt-5 space-y-4">
        <Fact term="What was promised" text={project.promised} />
        <Fact term="What was spent" text={project.spent} />
        <Fact term="What arrived" text={project.got} />
        <Fact term="Why this is on the waste list" text={project.why} />
      </dl>
      <h3 className="mt-6 text-sm tracking-wide text-muted uppercase">Who the money touched</h3>
      <ul className="mt-2 divide-y divide-line">
        {project.who.map((party) => (
          <li key={party.role} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="text-muted">{party.role}</span>
            <span className="text-right text-fg">{party.name}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-pretty text-muted">Source: {project.source}</p>
    </article>
  );
}

function Fact({ term, text }: { term: string; text: string }) {
  return (
    <div>
      <dt className="text-sm text-brass">{term}</dt>
      <dd className="mt-1 text-sm text-pretty text-fg">{text}</dd>
    </div>
  );
}
