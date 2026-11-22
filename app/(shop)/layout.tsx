import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { BottomNav, MobileCartPill, MobileTopBar } from "@/components/layout/MobileChrome";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopHeader />
      <MobileTopBar />
      <main id="contenu" className="flex w-full flex-1 flex-col pb-40 md:pb-0">
        {children}
      </main>
      <SiteFooter />
      <MobileCartPill />
      <BottomNav />
    </>
  );
}
