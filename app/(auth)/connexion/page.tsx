import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace gourmet La Dentelle pour commander et suivre vos livraisons à Alger.",
};

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
      <AuthScreen />
    </Suspense>
  );
}
