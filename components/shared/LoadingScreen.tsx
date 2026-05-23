export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Загрузка…</p>
      </div>
    </div>
  );
}
