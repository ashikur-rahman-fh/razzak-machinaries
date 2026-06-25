export function DataTableRefreshBar() {
  return (
    <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-primary/20" aria-hidden>
      <div className="h-full w-1/3 animate-pulse bg-primary" />
    </div>
  );
}
