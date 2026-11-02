import * as Slider from "@radix-ui/react-slider";
import { motion, useReducedMotion } from "motion/react";

import { DEFAULT_ENTITY_FILTERS, type EntityFilters } from "@/lib/entity-filters";

function RangeFilter({
  label,
  max,
  value,
  money,
  onChange,
}: {
  label: string;
  max: number;
  value: [number, number] | null;
  money?: boolean;
  onChange: (value: [number, number]) => void;
}) {
  const reduce = useReducedMotion();
  const low = Math.min(max, value?.[0] ?? 0);
  const high = Math.max(low, Math.min(max, value?.[1] ?? max));
  const format = (n: number) =>
    money
      ? new Intl.NumberFormat("en-ZA", {
          style: "currency",
          currency: "ZAR",
          maximumFractionDigits: 2,
        }).format(n / 100)
      : n.toLocaleString("en-ZA");
  return (
    <fieldset className="entity-range-filter">
      <legend>{label}</legend>
      <div className="entity-range-readout">
        <span>{format(low)}</span>
        <span>{format(high)}</span>
      </div>
      <Slider.Root
        className="entity-range-root"
        min={0}
        max={Math.max(1, max)}
        step={1}
        value={[low, high]}
        disabled={max === 0}
        onValueChange={(next) => onChange([next[0], next[1]])}
      >
        <Slider.Track className="entity-range-track">
          <Slider.Range className="entity-range-fill" />
        </Slider.Track>
        {["Minimum", "Maximum"].map((name) => (
          <Slider.Thumb
            key={name}
            asChild
            aria-label={`${name} ${label.toLowerCase()}`}
            aria-valuetext={format(name === "Minimum" ? low : high)}
          >
            <motion.span
              className="entity-range-thumb"
              whileHover={reduce ? undefined : { scale: 1.15 }}
              whileTap={reduce ? undefined : { scale: 1.25 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            />
          </Slider.Thumb>
        ))}
      </Slider.Root>
      <div className="entity-range-inputs">
        {([low, high] as const).map((n, index) => (
          <label key={index}>
            <span>{index ? "Max" : "Min"}</span>
            <input
              type="number"
              aria-label={`${index ? "Maximum" : "Minimum"} ${label.toLowerCase()} exact value`}
              min={index ? low / (money ? 100 : 1) : 0}
              max={(index ? max : high) / (money ? 100 : 1)}
              step={money ? "0.01" : "1"}
              value={n / (money ? 100 : 1)}
              disabled={max === 0}
              onChange={(event) => {
                if (!event.target.value) return;
                const parsed = Math.round(Number(event.target.value) * (money ? 100 : 1));
                if (!Number.isFinite(parsed)) return;
                onChange(
                  index
                    ? [low, Math.max(low, Math.min(max, parsed))]
                    : [Math.max(0, Math.min(high, parsed)), high],
                );
              }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function RelationshipFilters({
  filters,
  maxAmount,
  maxWins,
  showing,
  total,
  onChange,
}: {
  filters: EntityFilters;
  maxAmount: number;
  maxWins: number;
  showing: number;
  total: number;
  onChange: (filters: EntityFilters) => void;
}) {
  return (
    <section className="entity-filters" aria-label="Company and buyer filters">
      <div className="entity-filter-top">
        <fieldset>
          <legend>Show in the network</legend>
          <label>
            <input
              type="checkbox"
              checked={filters.buyers}
              onChange={(event) => onChange({ ...filters, buyers: event.target.checked })}
            />
            Buyers
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.suppliers}
              onChange={(event) => onChange({ ...filters, suppliers: event.target.checked })}
            />
            Suppliers
          </label>
        </fieldset>
        <span role="status">
          {showing.toLocaleString("en-ZA")} of {total.toLocaleString("en-ZA")} entities shown
        </span>
        <button type="button" onClick={() => onChange(DEFAULT_ENTITY_FILTERS)}>
          Reset filters
        </button>
      </div>
      <div className="entity-filter-ranges">
        <RangeFilter
          label="Total awarded"
          money
          max={maxAmount}
          value={filters.amount}
          onChange={(amount) => onChange({ ...filters, amount })}
        />
        <RangeFilter
          label="Tenders awarded"
          max={maxWins}
          value={filters.wins}
          onChange={(wins) => onChange({ ...filters, wins })}
        />
      </div>
      <p>
        Ranges apply to suppliers. Buyers stay visible while checked. Narrowing the value range
        excludes suppliers with unknown award amounts. Totals cover loaded records.
      </p>
    </section>
  );
}
