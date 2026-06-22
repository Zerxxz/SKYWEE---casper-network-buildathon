"use client"

import * as React from "react"

/**
 * Skeleton loader — shimmer animation placeholder.
 * Respects reduced motion preference via CSS.
 */

interface SkeletonProps {
  className?: string
  /** Width — accepts any CSS value. Default: 100% */
  width?: string | number
  /** Height — accepts any CSS value. Default: 16px */
  height?: string | number
  /** Border radius — accepts any CSS value. Default: 4px (from CSS) */
  rounded?: string
}

export function Skeleton({ className = "", width, height, rounded }: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius: rounded,
  }
  return <div className={`skywee-skeleton ${className}`} style={style} aria-hidden />
}

/**
 * Skeleton card — for KPI cards, module cards, etc.
 */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl skywee-hairline bg-foreground/[0.02] p-4 sm:p-5 ${className}`}>
      <Skeleton width={80} height={10} />
      <Skeleton width={120} height={28} className="mt-2" />
      <Skeleton width={100} height={10} className="mt-1" />
      <div className="mt-3 pt-3 border-t border-border/50">
        <Skeleton width={60} height={10} />
      </div>
    </div>
  )
}

/**
 * Skeleton table row — for agent registry, RWA assets, etc.
 */
export function SkeletonTableRow({ columns = 6 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/40">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === 0 ? 100 : i === columns - 1 ? 80 : 60}
          height={12}
          className="flex-1"
        />
      ))}
    </div>
  )
}

/**
 * Skeleton chart — for volume chart placeholder.
 */
export function SkeletonChart({ height = 220 }: { height?: number }) {
  return (
    <div className="rounded-xl skywee-glass p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton width={180} height={10} />
          <Skeleton width={120} height={20} className="mt-2" />
        </div>
        <Skeleton width={50} height={14} />
      </div>
      <Skeleton width="100%" height={height} rounded="8px" />
    </div>
  )
}

/**
 * Skeleton list item — for activity feed, proposal lists, etc.
 */
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
      <Skeleton width={6} height={6} rounded="50%" />
      <div className="flex-1">
        <Skeleton width={120} height={12} />
        <Skeleton width={80} height={10} className="mt-1" />
      </div>
      <Skeleton width={60} height={12} />
    </div>
  )
}
