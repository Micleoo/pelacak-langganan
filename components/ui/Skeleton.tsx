import React from "react";

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}
      {...props}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-8">
      {/* Title & Action */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Hero Card Skeleton */}
      <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-6 space-y-3">
        <Skeleton className="h-4 w-36 bg-primary-100" />
        <Skeleton className="h-12 w-64 bg-primary-200/80" />
        <Skeleton className="h-3 w-44 bg-primary-100" />
      </div>

      {/* Jatuh Tempo Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Breakdown Kategori Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExpensesSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-0 divide-y divide-slate-100">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
