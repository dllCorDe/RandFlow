import { Building2, Info, Landmark } from "lucide-react";

export function RelationshipLegend() {
  return (
    <details
      className="relationship-info"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.currentTarget.open = false;
          event.currentTarget.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>
        <Info size={15} />
        Legend &amp; info
      </summary>
      <div className="relationship-info-panel">
        <h3>Who’s who in the network</h3>
        <div className="relationship-info-entry">
          <Building2 size={18} />
          <div>
            <h4>Supplier · solid green circle</h4>
            <p>
              A company named as a winner of a tender. It supplies goods, services, or construction
              work to a public organisation.
            </p>
          </div>
        </div>
        <div className="relationship-info-entry">
          <Landmark size={18} />
          <div>
            <h4>Public buyer · dashed blue circle</h4>
            <p>
              The government department, municipality, or public entity asking for the work. Here, a
              tender is attached to its buyer when no winning supplier is published—even if its
              status says “Awarded”.
            </p>
          </div>
        </div>
        <p>
          <strong>Bubble size:</strong> suppliers with more tenders won in the loaded records have
          larger bubbles. Buyer bubbles have a fixed size; they do not represent tender wins.
        </p>
        <p>
          <strong>Small dots:</strong> attached tenders. Green = awarded, blue = open or in
          progress, grey = closed or cancelled. Select a company and choose “Explore tenders” to
          inspect them.
        </p>
        <p>
          <strong>Total awarded:</strong> the sum of published award amounts for that supplier in
          the current filters and loaded records. Unknown amounts are flagged. An award does not
          confirm payment or completed work.
        </p>
        <p className="relationship-info-note">
          Lines show tender relationships, not company ownership. If loading is incomplete, counts
          and totals are incomplete too.
        </p>
      </div>
    </details>
  );
}
