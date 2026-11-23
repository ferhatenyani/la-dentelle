import { GroupTransition } from "@/components/layout/PageTransition";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GroupTransition>
      <main id="contenu" className="flex w-full flex-1 flex-col bg-surface">
        {children}
      </main>
    </GroupTransition>
  );
}
