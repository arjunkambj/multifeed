export function DashboardPageTitle({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        {title}
      </h1>
    </div>
  );
}
