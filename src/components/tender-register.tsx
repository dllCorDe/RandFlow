import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { PROVINCES, TENDER_STATUSES } from "@/data/provinces";
import { findTenders, listTenders, readTender, type TenderDetail, type TenderRow } from "@/lib/tenders.functions";

function statusLine(detail: TenderDetail): string {
  if (detail.status === "Published") {
    return detail.closing
      ? `Open. Companies can still bid. It closes ${detail.closing}.`
      : "Open. Companies can still bid. No closing time was published.";
  }
  if (detail.status === "Awarded") {
    if (detail.awards.length === 0) {
      return "Marked awarded. The winning company was not on the record Treasury returned.";
    }
    if (detail.awards.length === 1) {
      const award = detail.awards[0];
      return `Awarded to ${award.company} for ${award.amount}.`;
    }
    return `Split across ${detail.awards.length} companies. The amounts below are what Treasury published.`;
  }
  if (detail.status === "Cancelled") {
    return detail.cancelReason
      ? `Cancelled. The published reason: ${detail.cancelReason}.`
      : "Cancelled. No reason was published on this record.";
  }
  if (detail.status === "Closed") {
    const why = detail.closeNote ?? "Bidding has ended.";
    return detail.bidderCount
      ? `${why} ${detail.bidderCount.toLocaleString("en-ZA")} companies are named. No winner is on this record.`
      : `${why} No bidders were published either.`;
  }
  if (detail.status === "Evaluation") return "Closed and being scored. No winner yet.";
  if (detail.status === "Adjudication") return "Being decided. No winner published yet.";
  return detail.status || "Status was not published.";
}

export function TenderRegister() {
  const [province, setProvince] = useState("");
  const [status, setStatus] = useState("1");
  const [query, setQuery] = useState("");
  const [needle, setNeedle] = useState("");
  const [company, setCompany] = useState("");
  const [companyNeedle, setCompanyNeedle] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<TenderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TenderDetail | null>(null);
  const [checking, setChecking] = useState(false);

  const searching = needle.length >= 3 && companyNeedle.length < 2;
  const companyActive = status === "2" && companyNeedle.length >= 2;
  const provinceName = PROVINCES.find((item) => item.id === province)?.label ?? "All provinces";

  useEffect(() => {
    const handle = setTimeout(() => setNeedle(query.trim()), 400);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const handle = setTimeout(() => setCompanyNeedle(company.trim()), 400);
    return () => clearTimeout(handle);
  }, [company]);

  useEffect(() => {
    setPage(0);
    setOpenId(null);
    setDetail(null);
  }, [province, status, needle, companyNeedle]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const run = searching
      ? findTenders({ data: { query: needle } }).then((found) => {
          const filtered = provinceName === "All provinces" ? found : found.filter((row) => row.province === provinceName);
          return { total: filtered.length, rows: filtered };
        })
      : listTenders({
          data: { province, status, page, company: companyActive ? companyNeedle : "" },
        }).then((result) => ({
          total: result.total,
          rows: result.rows,
        }));
    run
      .then((result) => {
        if (cancelled) return;
        setTotal(result.total);
        setRows(result.rows);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setError("Treasury’s tender site did not answer. Try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searching, needle, province, provinceName, status, page, companyActive, companyNeedle]);

  function lookupCompany(name: string) {
    setStatus("2");
    setQuery("");
    setNeedle("");
    setCompany(name);
    setCompanyNeedle(name);
    setPage(0);
    setOpenId(null);
    setDetail(null);
  }

  function check(id: number) {
    setOpenId(id);
    setChecking(true);
    setDetail(null);
    readTender({ data: { id } })
      .then((next) => setDetail(next))
      .catch(() => setError("Could not read that tender’s status."))
      .finally(() => setChecking(false));
  }

  const from = total === 0 ? 0 : page * 12 + 1;
  const to = Math.min(total, from + rows.length - 1);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <h2 className="font-display text-2xl text-fg">Every published tender</h2>
        <p className="mt-2 text-sm text-pretty text-muted">
          This list is read live from National Treasury’s eTenders portal. It is every tender an
          organ of state has captured there: open, closed, awarded or cancelled. It is not every
          invoice, and it is not a verdict that the work was done well.
        </p>
        <label className="relative mt-4 block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tender number or words, such as Giyani"
            className="min-h-11 w-full rounded-xl border border-line bg-ink pr-3 pl-9 text-fg"
          />
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Province">
          {PROVINCES.map((item) => (
            <Chip key={item.id || "all"} on={province === item.id} label={item.label} onClick={() => setProvince(item.id)} />
          ))}
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto" role="group" aria-label="Tender status">
          {TENDER_STATUSES.map((item) => (
            <Chip
              key={item.id}
              on={!searching && status === item.id}
              label={item.label}
              onClick={() => {
                setQuery("");
                setNeedle("");
                setCompany("");
                setCompanyNeedle("");
                setStatus(item.id);
              }}
            />
          ))}
        </div>
        {status === "2" && !searching && (
          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Winning company, such as the name on an award"
              className="min-h-11 w-full rounded-xl border border-line bg-ink pr-3 pl-9 text-fg"
            />
          </label>
        )}
        <p className="mt-3 text-sm text-muted">
          {loading
            ? searching
              ? "Searching the register…"
              : "Reading the register…"
            : searching
              ? `${total.toLocaleString("en-ZA")} match${total === 1 ? "" : "es"} across every status${provinceName === "All provinces" ? "" : ` in ${provinceName}`}. A search returns the first matches Treasury sends.`
            : companyActive
              ? `${total.toLocaleString("en-ZA")} tenders naming ${companyNeedle}${provinceName === "All provinces" ? "" : ` in ${provinceName}`}. The status on each card is the one Treasury published. Showing ${from}–${to}.`
              : `${total.toLocaleString("en-ZA")} ${TENDER_STATUSES.find((item) => item.id === status)?.label.toLowerCase()} tenders${provinceName === "All provinces" ? "" : ` in ${provinceName}`}. Showing ${from}–${to}.`}
        </p>
        {error && <p className="mt-2 text-sm text-brass">{error}</p>}
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => check(row.id)}
                className={
                  "w-full rounded-xl border px-3 py-3 text-left " +
                  (openId === row.id ? "border-brass bg-raised" : "border-line bg-ink")
                }
              >
                <span className="text-xs tracking-wide text-brass uppercase">
                  {row.status} · {row.province}
                </span>
                <span className="mt-1 block text-fg">{row.number || "No number"}</span>
                <span className="mt-1 line-clamp-2 block text-sm text-muted">{row.title}</span>
                {row.winner && (
                  <span className="mt-2 block text-sm text-fg">
                    {row.winner}
                    {row.winnerAmount ? ` · ${row.winnerAmount}` : ""}
                    {row.extraAwards > 0 ? ` · and ${row.extraAwards} more` : ""}
                  </span>
                )}
                {!row.winner && row.bidderCount > 0 && (
                  <span className="mt-2 block text-sm text-fg">
                    {row.bidderCount.toLocaleString("en-ZA")} companies bid
                    {row.closeNote ? ` · ${row.closeNote}` : ""}
                  </span>
                )}
              </button>
            </li>
          ))}
          {!loading && rows.length === 0 && (
            <li className="px-1 py-6 text-sm text-muted">Nothing in this slice of the register.</li>
          )}
        </ul>
        {!searching && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={page === 0 || loading}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className="min-h-11 rounded-full border border-line px-4 text-sm text-fg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={loading || to >= total}
              onClick={() => setPage((current) => current + 1)}
              className="min-h-11 rounded-full border border-line px-4 text-sm text-fg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>
      <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
        {checking && <p className="text-sm text-muted">Checking the live status…</p>}
        {!checking && detail && (
          <TenderStory detail={detail} onRefresh={() => check(detail.id)} onCompany={lookupCompany} />
        )}
        {!checking && !detail && (
          <div>
            <h2 className="font-display text-2xl text-fg">Check a tender</h2>
            <p className="mt-2 text-sm text-pretty text-muted">
              Awarded tenders name who was paid, how much, and whether that company is micro, small
              or large. Closed tenders name who bid, and that no winner has been published. Bid
              prices are not in this record.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function TenderStory({
  detail,
  onRefresh,
  onCompany,
}: {
  detail: TenderDetail;
  onRefresh: () => void;
  onCompany: (name: string) => void;
}) {
  return (
    <article>
      <p className="text-xs tracking-wide text-brass uppercase">{detail.province}</p>
      <h2 className="mt-1 font-display text-3xl text-balance text-fg">{detail.number || "Tender"}</h2>
      <p className="mt-2 text-pretty text-fg">{detail.title}</p>
      <p className="mt-4 text-pretty text-fg">{statusLine(detail)}</p>
      <dl className="mt-5 space-y-3 text-sm">
        <Fact term="Who is buying" text={detail.buyer || "Not stated"} />
        <Fact term="Where" text={detail.place || detail.province} />
        <Fact term="How it was bought" text={detail.type || detail.category || "Not stated"} />
        {detail.closing && <Fact term="Closing" text={detail.closing} />}
        {detail.cancelReason && <Fact term="Why it was cancelled" text={detail.cancelReason} />}
      </dl>
      {detail.awards.length > 0 && (
        <>
          <h3 className="mt-5 text-sm tracking-wide text-muted uppercase">Who was paid</h3>
          <ul className="mt-2 space-y-3">
            {detail.awards.map((award) => (
              <li key={award.company + award.amount} className="rounded-xl border border-line bg-ink px-3 py-3">
                <p className="text-fg">{award.company}</p>
                <p className="mt-1 text-sm text-brass tabular-nums">{award.amount}</p>
                <p className="mt-1 text-sm text-muted">
                  {[award.size, award.date].filter(Boolean).join(" · ") || "No size or date published"}
                </p>
                {award.points && <p className="mt-1 text-sm text-muted">Points published: {award.points}</p>}
                {award.subcontractors.length > 0 && (
                  <p className="mt-1 text-sm text-muted">Subcontracted to {award.subcontractors.join(", ")}</p>
                )}
                <button
                  type="button"
                  onClick={() => onCompany(award.company)}
                  className="mt-2 min-h-11 text-sm text-brass"
                >
                  Other awards to this company
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">
            Micro, small and large follow the B-BBEE size class Treasury recorded, not a check of the company’s books.
          </p>
        </>
      )}
      {detail.bidders.length > 0 && (
        <>
          <h3 className="mt-5 text-sm tracking-wide text-muted uppercase">Who bid</h3>
          <p className="mt-1 text-sm text-muted">
            Names only. Treasury did not publish what each one offered.
            {detail.bidderCount > detail.bidders.length
              ? ` Showing ${detail.bidders.length} of ${detail.bidderCount.toLocaleString("en-ZA")}.`
              : ""}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-fg">
            {detail.bidders.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </>
      )}
      {detail.documents.length > 0 && (
        <>
          <h3 className="mt-5 text-sm tracking-wide text-muted uppercase">Papers on eTenders</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {detail.documents.map((doc) => (
              <li key={doc.url}>
                <a href={doc.url} className="text-brass underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                  {doc.name}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-4 text-sm text-muted">Checked {detail.checkedAt}, from eTenders.</p>
      <button
        type="button"
        onClick={onRefresh}
        className="mt-3 min-h-11 rounded-full border border-brass px-4 text-sm text-brass"
      >
        Check status again
      </button>
    </article>
  );
}

function Fact({ term, text }: { term: string; text: string }) {
  return (
    <div>
      <dt className="text-brass">{term}</dt>
      <dd className="mt-1 text-pretty text-fg">{text}</dd>
    </div>
  );
}

function Chip({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
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
