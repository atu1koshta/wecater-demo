import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="md:pl-[72px] lg:pl-[240px]">
        <TopHeader />
        <main className="pb-20 md:pb-8">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
