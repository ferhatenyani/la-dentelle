import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

interface Props {
  product: Pick<Product, "name" | "images" | "icon">;
  index?: number;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

/** Product photo with a branded fallback (drinks have no photography). Fills its positioned parent. */
export function ProductImage({ product, index = 0, sizes, className, imgClassName, priority }: Props) {
  const src = product.images[index];
  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-surface-container", className)}>
      {src ? (
        <Image
          src={src}
          alt={product.name}
          fill
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <div
          role="img"
          aria-label={product.name}
          className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary-container to-primary"
        >
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary-fixed/10" aria-hidden />
          <div className="absolute -bottom-14 -left-8 size-44 rounded-full border border-secondary-fixed/20" aria-hidden />
          <span className="grid size-20 place-items-center rounded-full bg-secondary-container/90 text-on-secondary-fixed shadow-md">
            <Icon name={product.icon ?? "restaurant"} size={40} />
          </span>
        </div>
      )}
    </div>
  );
}
