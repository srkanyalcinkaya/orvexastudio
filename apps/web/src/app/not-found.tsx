import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs tracking-[0.24em] text-muted-foreground">ERROR 404</p>
      <h1 className="mt-3 text-4xl md:text-5xl">Sayfa Bulunamadi</h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        Aradiginiz sayfa kaldirilmis, tasinmis olabilir ya da URL yanlis girilmis olabilir.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={cn(buttonVariants({ size: "lg" }))}>
          Ana Sayfaya Don
        </Link>
        <Link href="/shop" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Shop Sayfasina Git
        </Link>
      </div>
    </section>
  );
}
