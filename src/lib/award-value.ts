import type { GraphNode } from "./tenders.functions";

export function awardValue(node: GraphNode, compact = false): string {
  const cents = BigInt(node.totalAwardedCents ?? "0");
  if (cents === 0n && node.missingAwardAmounts) return "Not published";
  const value = compact
    ? `R${new Intl.NumberFormat("en-ZA", { notation: "compact", maximumFractionDigits: 1 }).format(Number(cents) / 100)}`
    : `R${new Intl.NumberFormat("en-ZA").format(cents / 100n)},${(cents % 100n).toString().padStart(2, "0")}`;
  return `${value}${node.missingAwardAmounts ? " + unknown" : ""}`;
}
