import { createServerFn } from "@tanstack/react-start";

const FILTER = "https://www.etenders.gov.za/Home/TenderFilter/";
const SEARCH = "https://www.etenders.gov.za/Home/SearchTender";
const DETAIL = "https://www.etenders.gov.za/Home/tenderDetails";

const PROVINCE_IDS = new Set(["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
const STATUS_IDS = new Set(["1", "2", "3", "4"]);
const PAGE_SIZE = 12;

export type TenderRow = {
  id: number;
  number: string;
  title: string;
  buyer: string;
  province: string;
  category: string;
  status: string;
  closing: string | null;
  published: string | null;
  town: string | null;
  winner: string | null;
  winnerAmount: string | null;
  extraAwards: number;
  bidderCount: number;
  closeNote: string | null;
};

export type TenderAward = {
  company: string;
  amount: string;
  date: string | null;
  size: string | null;
  points: string | null;
  subcontractors: string[];
};

export type TenderDetail = TenderRow & {
  type: string;
  place: string;
  awards: TenderAward[];
  cancelReason: string | null;
  bidders: string[];
  documents: { name: string; url: string }[];
  checkedAt: string;
};

export type TenderPage = {
  total: number;
  page: number;
  pageSize: number;
  rows: TenderRow[];
};

export type GraphNode = {
  id: string;
  kind: "company" | "job";
  label: string;
  detail: string;
  tone: "company" | "live" | "closed";
  tenderId: number | null;
  degree: number;
};

export type GraphLink = {
  source: string;
  target: string;
  tone: "live" | "closed";
};

export type LinkGraph = {
  nodes: GraphNode[];
  links: GraphLink[];
  total: number;
};

type Raw = Record<string, unknown>;

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function prettyDate(value: unknown): string | null {
  const text = asText(value);
  if (!text || text.startsWith("0001") || text.startsWith("1900")) return null;
  const bare = text.includes("T") ? text : text.replace(" ", "T");
  const hasZone = /Z$|[+-]\d\d:\d\d$/.test(bare);
  const date = new Date(hasZone ? bare : `${bare}+02:00`);
  if (Number.isNaN(date.getTime())) return null;
  const midnight = /T00:00/.test(bare);
  return date.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(midnight ? {} : { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const }),
    timeZone: "Africa/Johannesburg",
  });
}

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`eTenders answered ${response.status}`);
  return response.json();
}

function sizeLabel(code: string): string | null {
  const key = code.toUpperCase();
  if (key === "EME") return "Micro business (EME)";
  if (key === "QSE") return "Small business (QSE)";
  if (key === "GEN") return "Large business (GEN)";
  return code || null;
}

function plainClose(reason: string): string | null {
  if (!reason) return null;
  const text = reason.toLowerCase();
  if (text.includes("closing date")) return "The closing date passed. No winner is published.";
  if (text === "tender closed") return "The department marked it closed. No winner is published.";
  return reason;
}

function awardsOf(raw: Raw): TenderAward[] {
  const awards = Array.isArray(raw.awards) ? raw.awards : [];
  return awards.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const award = item as Raw;
    if (award.isDeleted) return [];
    const company = asText(award.company);
    if (!company) return [];
    const subs = Array.isArray(award.subContractor) ? award.subContractor : [];
    const subcontractors = subs.flatMap((sub) => {
      if (!sub || typeof sub !== "object") return [];
      const row = sub as Raw;
      const name = asText(row.subContractorName);
      if (!name) return [];
      const pct = row.subContractingPercentage;
      const pctText = typeof pct === "number" && pct > 0 ? ` (${pct}%)` : "";
      return [`${name}${pctText}`];
    });
    const points = asText(award.pointsAwarded) || asText(award.beeScoring);
    return [
      {
        company,
        amount: asText(award.tenderAmount) || "Amount not published",
        date: prettyDate(award.awardDate),
        size: sizeLabel(asText(award.enterpriseType)),
        points: points || null,
        subcontractors,
      },
    ];
  });
}

function bidderNames(raw: Raw): string[] {
  const bidders = Array.isArray(raw.bidders) ? raw.bidders : [];
  const names = bidders.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const name = asText((item as Raw).biddersName);
    return name ? [name] : [];
  });
  return [...new Set(names)];
}

function closeNoteOf(raw: Raw): string | null {
  const closed = raw.closed;
  if (!closed || typeof closed !== "object") return null;
  return plainClose(asText((closed as Raw).reason));
}

function rowFromFilter(raw: Raw): TenderRow {
  const awards = awardsOf(raw);
  const bidders = bidderNames(raw);
  return {
    id: Number(raw.id) || 0,
    number: asText(raw.tender_No),
    title: asText(raw.description) || "Untitled tender",
    buyer: asText(raw.organ_of_State) || asText(raw.department),
    province: asText(raw.province) || "Not stated",
    category: asText(raw.category),
    status: asText(raw.status) || "Not stated",
    closing: prettyDate(raw.closing_Date),
    published: prettyDate(raw.date_Published),
    town: asText(raw.town) || null,
    winner: awards[0]?.company ?? null,
    winnerAmount: awards[0]?.amount ?? null,
    extraAwards: Math.max(0, awards.length - 1),
    bidderCount: bidders.length,
    closeNote: closeNoteOf(raw),
  };
}

function documentsOf(raw: Raw): { name: string; url: string }[] {
  const docs = Array.isArray(raw.supportDocument) ? raw.supportDocument : [];
  return docs.slice(0, 6).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const doc = item as Raw;
    const id = asText(doc.supportDocumentID);
    const name = asText(doc.fileName);
    const extension = asText(doc.extension);
    if (!id || !name) return [];
    const url =
      "https://www.etenders.gov.za/home/Download/?blobName=" +
      encodeURIComponent(id + extension) +
      "&downloadedFileName=" +
      encodeURIComponent(name);
    return [{ name, url }];
  });
}

function cancelReason(raw: Raw): string | null {
  const cancelled = raw.cancelled;
  if (!cancelled || typeof cancelled !== "object") return null;
  return asText((cancelled as Raw).reason) || null;
}

async function filterOnce(query: Record<string, string>): Promise<{ total: number; rows: Raw[] }> {
  const params = new URLSearchParams({
    draw: "1",
    start: query.start ?? "0",
    length: query.length ?? "1",
    status: query.status ?? "1",
    province: query.province ?? "",
    category: "",
    department: "",
    cluster: "",
    type: "",
    esubmissions: "",
    tenderNumber: query.tenderNumber ?? "",
    company: (query.company ?? "").slice(0, 80),
    supplierNumber: "",
  });
  const payload = (await readJson(`${FILTER}?${params.toString()}`)) as Raw;
  const rows = Array.isArray(payload.data) ? (payload.data as Raw[]) : [];
  return { total: Number(payload.recordsFiltered) || rows.length, rows };
}

export const listTenders = createServerFn({ method: "GET" })
  .validator((data: { province?: string; status?: string; page?: number; company?: string }) => data)
  .handler(async ({ data }): Promise<TenderPage> => {
    const province = PROVINCE_IDS.has(data?.province ?? "") ? (data?.province ?? "") : "";
    const status = STATUS_IDS.has(data?.status ?? "") ? (data?.status ?? "1") : "1";
    const page = Math.max(0, Math.min(400, Math.floor(Number(data?.page) || 0)));
    const company = asText(data?.company).slice(0, 80);
    const result = await filterOnce({
      province,
      status,
      company,
      start: String(page * PAGE_SIZE),
      length: String(PAGE_SIZE),
    });
    return {
      total: result.total,
      page,
      pageSize: PAGE_SIZE,
      rows: result.rows.map(rowFromFilter).filter((row) => row.id),
    };
  });

export const findTenders = createServerFn({ method: "GET" })
  .validator((data: { query?: string }) => data)
  .handler(async ({ data }): Promise<TenderRow[]> => {
    const query = asText(data?.query).slice(0, 80);
    if (query.length < 3) return [];
    const payload = await readJson(`${SEARCH}?tenderName=${encodeURIComponent(query)}`);
    if (!Array.isArray(payload)) return [];
    return payload.slice(0, 40).flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const raw = item as Raw;
      const id = Number(raw.id) || 0;
      if (!id) return [];
      return [
        {
          id,
          number: asText(raw.tender_No),
          title: asText(raw.description) || "Untitled tender",
          buyer: asText(raw.department),
          province: asText(raw.province) || "Not stated",
          category: asText(raw.type),
          status: "Tap to check",
          closing: null,
          published: null,
          town: null,
          winner: null,
          winnerAmount: null,
          extraAwards: 0,
          bidderCount: 0,
          closeNote: null,
        } satisfies TenderRow,
      ];
    });
  });

export const readTender = createServerFn({ method: "GET" })
  .validator((data: { id?: number }) => data)
  .handler(async ({ data }): Promise<TenderDetail> => {
    const id = Math.floor(Number(data?.id));
    if (!Number.isFinite(id) || id <= 0) throw new Error("That tender id is not valid.");
    const payload = await readJson(`${DETAIL}?ID=${id}`);
    const first = Array.isArray(payload) ? (payload[0] as Raw | undefined) : undefined;
    if (!first) throw new Error("eTenders has no record for that tender.");
    const base = rowFromFilter({
      ...first,
      organ_of_State: first.department,
      description: first.description,
    });
    const number = base.number;
    let extra: Raw | undefined;
    const followStatus =
      base.status === "Awarded"
        ? "2"
        : base.status === "Cancelled"
          ? "4"
          : base.status === "Closed"
            ? "3"
            : base.status === "Published"
              ? "1"
              : "";
    if (followStatus && number) {
      try {
        const found = await filterOnce({ status: followStatus, tenderNumber: number, length: "5" });
        extra = found.rows.find((row) => Number(row.id) === id);
      } catch {
        extra = undefined;
      }
    }
    const names = extra ? bidderNames(extra) : [];
    const awards = extra ? awardsOf(extra) : [];
    return {
      ...base,
      winner: awards[0]?.company ?? base.winner,
      winnerAmount: awards[0]?.amount ?? base.winnerAmount,
      extraAwards: Math.max(0, awards.length - 1),
      bidderCount: names.length,
      closeNote: extra ? closeNoteOf(extra) : base.closeNote,
      type: asText(first.type),
      place: asText(first.delivery) || [base.town, base.province].filter(Boolean).join(", "),
      awards,
      cancelReason: extra ? cancelReason(extra) : null,
      bidders: names.slice(0, 40),
      documents: extra ? documentsOf(extra) : [],
      checkedAt: new Date().toLocaleString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: "Africa/Johannesburg",
      }),
    };
  });

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

export const loadLinkGraph = createServerFn({ method: "GET" })
  .validator((data: { company?: string; province?: string }) => data)
  .handler(async ({ data }): Promise<LinkGraph> => {
    const company = asText(data?.company).slice(0, 80);
    const province = PROVINCE_IDS.has(data?.province ?? "") ? (data?.province ?? "") : "";
    const lengths = company
      ? { awarded: "18", closed: "10", open: "8" }
      : { awarded: "14", closed: "8", open: "6" };
    const [awarded, closed, open] = await Promise.all([
      filterOnce({ status: "2", company, province, length: lengths.awarded }).catch(() => ({
        total: 0,
        rows: [] as Raw[],
      })),
      filterOnce({ status: "3", company, province, length: lengths.closed }).catch(() => ({
        total: 0,
        rows: [] as Raw[],
      })),
      filterOnce({ status: "1", company, province, length: lengths.open }).catch(() => ({
        total: 0,
        rows: [] as Raw[],
      })),
    ]);
    const rows = [...awarded.rows, ...open.rows, ...closed.rows];
    const companies = new Map<string, GraphNode>();
    const jobs: GraphNode[] = [];
    const links: GraphLink[] = [];
    const seen = new Set<number>();

    for (const raw of rows) {
      const tenderId = Number(raw.id) || 0;
      if (!tenderId || seen.has(tenderId)) continue;
      seen.add(tenderId);
      if (jobs.length >= 28) break;
      const status = asText(raw.status);
      const live = status === "Awarded" || status === "Published" || status === "Evaluation" || status === "Adjudication";
      const tone: "live" | "closed" = live ? "live" : "closed";
      const awards = awardsOf(raw);
      const winner = awards[0]?.company ?? "";
      const buyer = asText(raw.organ_of_State) || asText(raw.department) || "Unknown buyer";
      const anchorName = winner || buyer;
      const anchorId = `co-${slug(anchorName)}`;
      const existing = companies.get(anchorId);
      if (existing) {
        existing.degree += 1;
      } else {
        companies.set(anchorId, {
          id: anchorId,
          kind: "company",
          label: anchorName,
          detail: winner ? "Won the linked jobs." : "Asked for the work. No winning company is published.",
          tone: "company",
          tenderId: null,
          degree: 1,
        });
      }
      const jobId = `job-${tenderId}`;
      const number = asText(raw.tender_No) || `Tender ${tenderId}`;
      const amount = awards[0]?.amount;
      jobs.push({
        id: jobId,
        kind: "job",
        label: number,
        detail: [
          status || (live ? "Open" : "Closed"),
          asText(raw.province),
          winner ? `Awarded to ${winner}` : "No winner published",
          amount && amount !== "Amount not published" ? amount : "",
          (asText(raw.description) || "").slice(0, 180),
        ]
          .filter(Boolean)
          .join(" · "),
        tone,
        tenderId,
        degree: 1,
      });
      links.push({ source: anchorId, target: jobId, tone });
    }

    return {
      nodes: [...companies.values(), ...jobs],
      links,
      total: awarded.total + closed.total + open.total,
    };
  });
