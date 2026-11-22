export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="contenu" className="flex w-full flex-1 flex-col bg-surface">
      {children}
    </main>
  );
}
