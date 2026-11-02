import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Building2, ChevronLeft, ChevronRight, FileText, MapPin } from "lucide-react";
import type { GraphNode } from "@/lib/tenders.functions";
import { TenderSourceLink } from "@/components/tender-source-link";

const PER_PAGE = 8;

export function CompanyTenders({
  entity,
  jobs,
  incomplete,
}: {
  entity: GraphNode;
  jobs: GraphNode[];
  incomplete?: boolean;
}) {
  const [page, setPage] = useState(0);
  const reduce = useReducedMotion();
  const buyer = entity.entityRole === "buyer";
  const tenders = buyer
    ? jobs
    : jobs.filter((job) => job.status === "Awarded" || job.detail.startsWith("Awarded ·"));
  const pages = Math.max(1, Math.ceil(tenders.length / PER_PAGE));
  const visible = tenders.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  return (
    <section
      className="company-tenders"
      aria-label={`${buyer ? "Buyer tenders" : "Awarded tenders"} for ${entity.label}`}
    >
      <header>
        <span className="company-tenders-icon">
          <FileText size={19} />
        </span>
        <div>
          <p>{buyer ? "BUYER’S TENDERS" : "AWARDED TENDERS"}</p>
          <h2>{entity.label}</h2>
          <span>
            {tenders.length.toLocaleString("en-ZA")} {buyer ? "linked" : "awarded"} tender
            {tenders.length === 1 ? "" : "s"} in the loaded records
            {incomplete ? " · incomplete data" : ""}
          </span>
        </div>
      </header>
      {buyer && (
        <p className="company-tenders-note">
          This public organisation requested the work. A winning supplier has not been published for
          these linked records.
        </p>
      )}
      {!tenders.length ? (
        <p className="company-tenders-note">
          No awarded tenders are available for this supplier in the loaded records.
        </p>
      ) : (
        <motion.div
          key={page}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="company-tender-cards"
        >
          {visible.map((job) => {
            const awards =
              job.awards?.filter(
                (award) => award.company.trim().toLowerCase() === entity.label.trim().toLowerCase(),
              ) ?? [];
            return (
              <article key={job.id} className="company-tender-card">
                <div className="company-tender-card-heading">
                  <h3>{job.label}</h3>
                  <span>{job.status ?? (buyer ? "Not stated" : "Awarded")}</span>
                </div>
                <p className="company-tender-description">
                  {job.description || job.detail || "Description not published."}
                </p>
                <div className="company-tender-meta">
                  {job.buyer && (
                    <span>
                      <Building2 size={13} />
                      {job.buyer}
                    </span>
                  )}
                  {job.province && (
                    <span>
                      <MapPin size={13} />
                      {job.province}
                    </span>
                  )}
                </div>
                {!buyer && (
                  <div className="company-tender-awards">
                    <span>Award to this supplier</span>
                    {awards.length ? (
                      awards.map((award, index) => (
                        <div key={index}>
                          <strong>{award.amount}</strong>
                          {award.date && <span>{award.date}</span>}
                        </div>
                      ))
                    ) : (
                      <strong>Amount not published</strong>
                    )}
                  </div>
                )}
                <TenderSourceLink id={job.tenderId} status={job.status} number={job.label} />
              </article>
            );
          })}
        </motion.div>
      )}
      <footer>
        <span>
          {tenders.length
            ? `${page * PER_PAGE + 1}–${Math.min((page + 1) * PER_PAGE, tenders.length)} of ${tenders.length} tenders`
            : "0 tenders"}
        </span>
        <div>
          <button
            type="button"
            aria-label="Previous awarded tenders"
            disabled={page === 0}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {page + 1} / {pages}
          </span>
          <button
            type="button"
            aria-label="Next awarded tenders"
            disabled={page + 1 >= pages}
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
      <p className="company-tenders-note">
        Published award amounts do not confirm payment or completed work. Select another company
        bubble to change this list.
      </p>
    </section>
  );
}
