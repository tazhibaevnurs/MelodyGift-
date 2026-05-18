import React from 'react'

/**
 * Premium skeleton placeholders for loading states (e.g. song generation, library).
 * Uses rounded-2xl and subtle pulse to match glassmorphism UI.
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`skeleton ${className}`}
      role="presentation"
      aria-hidden="true"
      {...props}
    />
  )
}

export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2 min-w-0">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      {lines >= 2 && <Skeleton className="h-3 w-full" />}
      {lines >= 3 && <Skeleton className="h-3 w-2/3" />}
    </div>
  )
}

/** Skeleton for song list item (play button + title + meta) */
export function SkeletonSongItem() {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

/** Skeleton for generation progress (wave + stages) */
export function SkeletonGeneration() {
  return (
    <div className="flex flex-col items-center py-8">
      <div className="flex items-center justify-center gap-1 mb-6 h-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-6 w-1 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-8 w-48 rounded-xl mb-2" />
      <Skeleton className="h-4 w-64 rounded-lg mb-8" />
      <div className="w-full max-w-xs space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-1.5 w-3/4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Skeleton
