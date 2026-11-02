import { createFileRoute } from "@tanstack/react-router";
import { LinkChart } from "@/components/link-chart";

export const Route = createFileRoute("/links")({
  component: LinkChart,
  head: () => ({
    meta: [{ title: "Who is tied to the work · Randflow" }],
  }),
});
