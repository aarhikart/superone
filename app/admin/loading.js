export default function AdminLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#4318FF]"></div>
        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </div>
    </div>
  );
}
