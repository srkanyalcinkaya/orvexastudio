import { ProductCard } from "@/components/product-card";
import { fetchCatalogProducts } from "@/lib/storefront";

interface ShopPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const query = await searchParams;
  const filtered = await fetchCatalogProducts(query.category);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-4xl">Shop 3D Lamps</h1>
      <p className="mt-2 text-muted-foreground">
        Desk, ambient ve smart kategorilerinden {filtered.length} adet secili 3D lamba modeli.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
