import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 md:space-y-10 p-2 md:p-8 pt-6 md:pt-10 bg-background min-h-screen overflow-x-hidden w-full animate-pulse">
      {/* Welcome Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="h-10 w-64 bg-muted rounded-xl" />
          <div className="h-4 w-48 bg-muted/60 rounded-lg" />
        </div>
        <div className="h-24 w-48 bg-muted rounded-2xl" />
      </div>

      {/* Smart Insights Skeleton */}
      <div className="h-20 w-full bg-muted/40 rounded-[32px]" />

      {/* Stats Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-40 bg-muted/30 border-none rounded-[24px]" />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 md:gap-8">
        <div className="col-span-1 md:col-span-1 lg:col-span-4 h-[400px] bg-muted/30 rounded-[32px]" />
        <div className="col-span-1 md:col-span-1 lg:col-span-3 h-[400px] bg-muted/30 rounded-[32px]" />
      </div>

      {/* Middle Section Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 md:gap-8">
        <div className="col-span-1 md:col-span-1 lg:col-span-4 h-[450px] bg-muted/30 rounded-[32px]" />
        <div className="col-span-1 md:col-span-1 lg:col-span-3 h-[450px] bg-muted/30 rounded-[32px]" />
      </div>

      {/* Bottom Section Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 md:gap-8">
        <div className="col-span-1 md:col-span-1 lg:col-span-4 h-[450px] bg-muted/30 rounded-[32px]" />
        <div className="col-span-1 md:col-span-1 lg:col-span-3 h-[450px] bg-muted/30 rounded-[32px]" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return <div className="h-40 w-full bg-muted/30 rounded-[24px] animate-pulse" />;
}

export function ChartSkeleton() {
  return <div className="h-[350px] w-full bg-muted/30 rounded-[32px] animate-pulse" />;
}
