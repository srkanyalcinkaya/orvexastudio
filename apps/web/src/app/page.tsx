import Link from "next/link";
import { AnimatedFadeIn } from "@/components/animated-fade-in";
import { ProductCard } from "@/components/product-card";
import { buttonVariants } from "@/components/ui/button";
import { fetchCatalogProducts } from "@/lib/storefront";
import { cn } from "@/lib/utils";

export default async function Home() {
  const products = await fetchCatalogProducts();
  const topPicks = products.slice(0, 4);

  return (
    <div className="space-y-20 pb-20">
      <section className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(246,243,237,0.9))]">
        <div className="mx-auto grid min-h-[65vh] max-w-7xl items-center gap-8 px-6 py-20 md:grid-cols-2">
          <AnimatedFadeIn>
            <p className="mb-4 text-sm uppercase tracking-[0.22em] text-muted-foreground">Extraordinary quality. Extraordinary service.</p>
            <h1 className="max-w-lg text-5xl leading-tight md:text-6xl">
              Modern 3D lamps crafted for immersive lighting experiences.
            </h1>
            <p className="mt-6 max-w-md text-muted-foreground">
              Premium materyaller, akilli LED kontrolu ve minimal tasarim diliyle mekanina karakter kazandir.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/shop" className={buttonVariants()}>
                Shop 3D Lamps
              </Link>
              <Link href="/shop?category=Smart" className={cn(buttonVariants({ variant: "outline" }), "px-4")}>
                Smart Collection
              </Link>
            </div>
          </AnimatedFadeIn>
          <div className="rounded-sm border border-border/60 bg-card p-5">
            <div
              className="h-[420px] rounded-sm bg-cover bg-center"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1800&q=80)",
              }}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-4xl">Top picks this week</h2>
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="/shop">
            View all
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {topPicks.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
