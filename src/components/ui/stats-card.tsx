"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  unit?: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  unit = "",
  description,
  trend = "neutral",
  trendValue,
  className,
}: StatsCardProps) {
  const [count, setCount] = useState(value);

  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-zinc-400",
  };

  const trendIcons = {
    up: "↑",
    down: "↓",
    neutral: "→",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm transition-all hover:border-zinc-700 hover:shadow-md",
        className
      )}
    >
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-bold tabular-nums text-zinc-50">
          {count.toLocaleString()}
        </span>
        {unit && <span className="text-lg text-zinc-400">{unit}</span>}
      </div>
      {(trendValue || description) && (
        <div className="mt-3 flex items-center gap-2">
          {trendValue && (
            <span className={cn("text-sm font-medium", trendColors[trend])}>
              {trendIcons[trend]} {trendValue}
            </span>
          )}
          {description && (
            <span className="text-sm text-zinc-500">{description}</span>
          )}
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setCount((c) => c + 1)}
          className="rounded-md bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
        >
          +1
        </button>
        <button
          onClick={() => setCount((c) => Math.max(0, c - 1))}
          className="rounded-md bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
        >
          −1
        </button>
        <button
          onClick={() => setCount(value)}
          className="rounded-md bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-700"
        >
          reset
        </button>
      </div>
    </div>
  );
}
