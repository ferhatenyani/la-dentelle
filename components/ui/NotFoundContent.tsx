import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function NotFoundContent() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Image src="/images/logo.jpg" alt="La Dentelle" width={96} height={96} className="mb-6 size-24 rounded-full shadow-float" />
      <span className="text-label-sm uppercase tracking-widest text-secondary">Erreur 404</span>
      <h1 className="mt-2 max-w-lg text-headline-lg-mobile text-primary md:text-headline-lg">Cette page s&apos;est échappée de la cuisine</h1>
      <p className="mt-3 max-w-md text-body-md text-on-surface-variant">
        Le plat ou la page que vous cherchez n&apos;existe pas ou n&apos;est plus à la carte.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/menu" className={buttonClasses({ size: "lg" })}>
          <Icon name="restaurant_menu" size={20} /> Retour à la carte
        </Link>
        <Link href="/" className={buttonClasses({ variant: "secondary", size: "lg" })}>
          Accueil
        </Link>
      </div>
    </div>
  );
}
