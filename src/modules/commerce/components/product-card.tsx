"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ExternalLink } from "lucide-react";
import { t } from "@/core/i18n";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasImage = !!product.thumbUrl;
  const hasMultipleVariants = product.variants.length > 1;
  const isPublished = product.status === "published";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative aspect-square bg-muted border-b">
          {hasImage ? (
            <Image
              src={product.thumbUrl!}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm ${
                isPublished
                  ? "bg-green-100/90 text-green-800 dark:bg-green-900/70 dark:text-green-200"
                  : "bg-muted/90 text-muted-foreground"
              }`}
            >
              {isPublished
                ? t("commerce.productStatusPublished")
                : t("commerce.productStatusDraft")}
            </span>
          </div>

          {/* External link */}
          {product.buyNowUrl && (
            <a
              href={product.buyNowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Open in Lemon Squeezy"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1.5">
          <h3
            className="font-medium text-sm leading-tight line-clamp-2"
            title={product.name}
          >
            {product.name}
          </h3>

          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              {hasMultipleVariants && (
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {t("commerce.productPriceFrom")}
                </p>
              )}
              <p className="text-base font-semibold tabular-nums">
                {product.priceFormatted}
              </p>
            </div>

            {hasMultipleVariants && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {t("commerce.productVariantsLabel", {
                  count: product.variants.length,
                })}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
