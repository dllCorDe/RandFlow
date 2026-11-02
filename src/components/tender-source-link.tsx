import { ArrowUpRight } from "lucide-react";
import { tenderSource } from "@/lib/tender-source";

export function TenderSourceLink({
  id,
  status,
  number,
}: {
  id: number | null;
  status?: string;
  number: string;
}) {
  const source = tenderSource(id, status);
  if (!source) return null;
  return (
    <div className="tender-source-link">
      <a
        className="relationship-action"
        href={source.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`${source.json ? "Open official JSON record" : "Open eTenders result"} for ${number}`}
      >
        {source.json ? "Open official record (JSON)" : "Open eTenders"}
        <ArrowUpRight size={15} />
      </a>
      <p>
        {source.json
          ? "Treasury serves this exact tender record as JSON, rather than a standalone tender page."
          : "Opens this tender in Treasury’s results. Use the + beside the result to expand its details."}
      </p>
    </div>
  );
}
