import type { GraphNode, GraphLink } from "./tenders.functions";
export type EntityFilters = {
  buyers: boolean;
  suppliers: boolean;
  amount: [number, number] | null;
  wins: [number, number] | null;
};
export const DEFAULT_ENTITY_FILTERS: EntityFilters = {
  buyers: true,
  suppliers: true,
  amount: null,
  wins: null,
};

export function supplierWins(jobs: GraphNode[], links: GraphLink[]): Map<string, number> {
  const awarded = new Set(
    jobs
      .filter((job) => job.status === "Awarded" || job.detail.startsWith("Awarded ·"))
      .map((job) => job.id),
  );
  const counts = new Map<string, number>();
  for (const link of links)
    if (awarded.has(link.target)) counts.set(link.source, (counts.get(link.source) ?? 0) + 1);
  return counts;
}

export function matchesEntityFilters(
  node: GraphNode,
  wins: number,
  filters: {
    buyers: boolean;
    suppliers: boolean;
    amount: [number, number] | null;
    wins: [number, number] | null;
  },
  maxAmount: number,
): boolean {
  if (node.entityRole === "buyer") return filters.buyers;
  if (!filters.suppliers) return false;
  if (filters.wins && (wins < filters.wins[0] || wins > filters.wins[1])) return false;
  const range = filters.amount;
  if (range && (range[0] > 0 || range[1] < maxAmount)) {
    if (node.missingAwardAmounts || node.totalAwardedCents === undefined) return false;
    const cents = BigInt(node.totalAwardedCents);
    if (cents < BigInt(range[0]) || cents > BigInt(range[1])) return false;
  }
  return true;
}
