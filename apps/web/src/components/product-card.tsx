import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StorefrontProduct } from "@/lib/storefront";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  return (
    <Link href={`/product/${product.slug}`}>
      <Card className="overflow-hidden border-border/60 transition hover:-translate-y-1 hover:shadow-lg">
        <div className="relative aspect-4/5">
          <Image src={product.image} alt={product.title} fill className="object-cover" />
        </div>
        <CardContent className="space-y-2 p-4">
          <Badge variant="secondary">{product.category}</Badge>
          <p className="text-lg">{product.title}</p>
          <p className="text-sm text-muted-foreground">£{product.price.toFixed(2)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
