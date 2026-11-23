import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = { title: "Espace Gourmet" };

export default function AccountPage() {
  return (
    <PageTransition>
      <AccountView />
    </PageTransition>
  );
}
