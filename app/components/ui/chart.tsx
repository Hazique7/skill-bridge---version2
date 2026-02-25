"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

/* ===================== Tooltip ===================== */

export const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  hideLabel?: boolean;
  className?: string;
};

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>((props, ref) => {
  const { active, payload, label, hideLabel, className } = props;

  if (!active || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-background px-3 py-2 text-xs shadow-md",
        className
      )}
    >
      {!hideLabel && label && (
        <div className="font-medium mb-1">{label}</div>
      )}

      {payload.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-2"
        >
          <span className="text-muted-foreground">
            {item.name}
          </span>
          <span className="font-mono">
            {item.value?.toLocaleString?.()}
          </span>
        </div>
      ))}
    </div>
  );
});

ChartTooltipContent.displayName = "ChartTooltip";

/* ===================== Legend ===================== */

type ChartLegendContentProps = {
  payload?: any[];
  verticalAlign?: "top" | "bottom" | "middle";
  className?: string;
};

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(({ payload, verticalAlign = "bottom", className }, ref) => {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
});

ChartLegendContent.displayName = "ChartLegend";