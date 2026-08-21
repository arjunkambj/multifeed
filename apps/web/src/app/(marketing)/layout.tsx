import { SmoothScroll } from "@/components/SmoothScroll";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div className="flex min-h-screen w-full flex-col bg-background selection:bg-primary selection:text-primary-foreground">
        {children}
      </div>
    </SmoothScroll>
  );
}
