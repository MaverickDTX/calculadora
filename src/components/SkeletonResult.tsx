export function SkeletonResult() {
  return (
    <div className="space-y-4 animate-fade-in" aria-hidden="true" aria-busy="true">
      {/* Painel de qualidade */}
      <div className="panel">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
          <div className="h-4 w-28 rounded-md animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
        </div>
        <div className="h-3 w-64 rounded-md animate-shimmer mt-2" style={{ background: 'var(--color-surface-hover)' }} />
      </div>

      {/* Stake display */}
      <div className="stake-display">
        <div className="h-3 w-24 rounded-md animate-shimmer mb-2" style={{ background: 'var(--color-surface-hover)' }} />
        <div className="h-10 w-36 rounded-md animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
        <div className="h-3 w-48 rounded-md animate-shimmer mt-1.5" style={{ background: 'var(--color-surface-hover)' }} />
      </div>

      {/* Métricas (grid 2 col) */}
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="metric-card">
            <div className="h-2.5 w-14 rounded-md animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
            <div className="h-6 w-16 rounded-md animate-shimmer mt-1.5" style={{ background: 'var(--color-surface-hover)' }} />
          </div>
        ))}
      </div>

      {/* Decomposição */}
      <div className="panel-collapsible">
        <div className="px-4 py-3.5">
          <div className="h-3 w-20 rounded-md animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
        </div>
        <div className="px-4 pb-4">
          <div className="h-12 w-full rounded-lg animate-shimmer" style={{ background: 'var(--color-surface-active)' }} />
        </div>
      </div>

      {/* Fluxo do ajuste */}
      <div className="panel-collapsible">
        <div className="px-4 py-3.5">
          <div className="h-3 w-20 rounded-md animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
        </div>
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            <div className="h-5 w-24 rounded-md animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
            <div className="h-5 w-28 rounded-md animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
            <div className="h-5 w-20 rounded-md animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
            <div className="h-5 w-18 rounded-md animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
          </div>
        </div>
      </div>

      {/* Confiança do modelo */}
      <div className="panel">
        <div className="h-2.5 w-24 rounded-md animate-shimmer mb-3" style={{ background: 'var(--color-surface-hover)' }} />
        <div className="flex items-center gap-2">
          <div className="h-5 w-12 rounded-md animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
          <div className="h-3 w-48 rounded-md animate-shimmer" style={{ background: 'var(--color-surface-hover)' }} />
        </div>
      </div>
    </div>
  );
}