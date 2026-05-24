export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full"
          style={{ border: '2px solid var(--bg-elevated)', borderTopColor: 'var(--text-1)', animation: 'spin 0.8s linear infinite' }} />
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Загрузка…</p>
      </div>
    </div>
  );
}
