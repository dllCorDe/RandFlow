import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatBn, formatPct, share } from "@/lib/format";

export type Slice = { id: string; name: string; value: number };

type TipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
};

function Tip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  if (item.value == null) return null;
  return (
    <div className="rounded-xl border border-line bg-ink px-3 py-2 shadow-none">
      <p className="text-sm text-fg">{item.name}</p>
      <p className="font-display text-lg text-brass tabular-nums">{formatBn(item.value)}</p>
    </div>
  );
}

const STEPS = [100, 46, 74, 34, 62, 40, 86, 28, 54, 22];

function tone(
  id: string,
  index: number,
  activeId: string | null,
  groupIds: string[] | null,
): string {
  const picked = activeId === id || (groupIds?.includes(id) ?? false);
  const idle = !activeId && !groupIds;
  const amount = idle ? STEPS[index % STEPS.length] : picked ? 100 : 16;
  return `color-mix(in oklab, var(--color-brass) ${amount}%, transparent)`;
}

export function SpendRing({
  slices,
  total,
  activeId,
  groupIds,
  onPick,
}: {
  slices: Slice[];
  total: number;
  activeId: string | null;
  groupIds: string[] | null;
  onPick: (id: string) => void;
}) {
  const drawn = slices.filter((s) => s.value > 0);
  return (
    <div className="relative h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={drawn}
            dataKey="value"
            nameKey="name"
            innerRadius="64%"
            outerRadius="82%"
            paddingAngle={1.1}
            stroke="transparent"
            isAnimationActive={false}
            onClick={(_, index) => {
              const slice = drawn[index];
              if (slice) onPick(slice.id);
            }}
          >
            {drawn.map((slice, index) => (
              <Cell key={slice.id} fill={tone(slice.id, index, activeId, groupIds)} />
            ))}
          </Pie>
          <Tooltip content={<Tip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Consolidated</p>
        <p className="font-display text-3xl text-fg tabular-nums sm:text-4xl">{formatBn(total)}</p>
        <p className="text-sm text-muted tabular-nums">{formatPct(100, 0)} of this year</p>
      </div>
    </div>
  );
}

export function FlowBar({
  slices,
  total,
  activeId,
  groupIds,
  onPick,
}: {
  slices: Slice[];
  total: number;
  activeId: string | null;
  groupIds: string[] | null;
  onPick: (id: string) => void;
}) {
  const drawn = slices.filter((s) => s.value > 0);
  return (
    <div
      className="flex h-11 w-full overflow-hidden rounded-full border border-line"
      role="list"
      aria-label="Share of consolidated spending"
    >
      {drawn.map((slice, index) => (
        <button
          key={slice.id}
          type="button"
          role="listitem"
          title={`${slice.name}: ${formatBn(slice.value)} · ${formatPct(share(slice.value, total))}`}
          onClick={() => onPick(slice.id)}
          className="h-full min-w-1"
          style={{
            width: `${share(slice.value, total)}%`,
            background: tone(slice.id, index, activeId, groupIds),
          }}
        />
      ))}
    </div>
  );
}
