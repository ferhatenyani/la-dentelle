import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { BottomNav, MobileCartPill, MobileTopBar } from "@/components/layout/MobileChrome";
import { GroupTransition } from "@/components/layout/PageTransition";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopHeader />
      <MobileTopBar />
      <GroupTransition>
        <main id="contenu" className="flex w-full flex-1 flex-col bg-surface pb-40 md:pb-0">
          {children}
        </main>
      </GroupTransition>
      <SiteFooter />
      <MobileCartPill />
      <BottomNav />
    </>
  );
}
