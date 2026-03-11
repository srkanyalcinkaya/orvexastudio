"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";
import { addCartItem, readCartItems } from "@/lib/cart-storage";
import { getUserFromSession } from "@/lib/session";
import type { StorefrontProduct } from "@/lib/storefront";
import { cn } from "@/lib/utils";

export function ProductDetailView({ product }: { product: StorefrontProduct }) {
  const router = useRouter();
  const gallery = useMemo(() => product.images?.length ? product.images : [product.image], [product.image, product.images]);
  const infoItems = useMemo(() => {
    const base = [
      "Malzeme: 3D-printed biodegradable plastic",
      "Kablo: 2.5m beyaz tekstil kablo, dimmer düğmeli",
      "Ampul: E27 dimmable LED (dahil)",
      "Voltaj: 230V / 50Hz",
      "Sertifika: CE onaylı",
    ];
    const extra = (product.specs ?? []).filter(Boolean);
    return [...base, ...extra];
  }, [product.specs]);
  const dimensions = useMemo(
    () => (product.dimensions?.length ? product.dimensions : ["Large: H34cm x W30cm", "Medium: H26cm x W23cm"]),
    [product.dimensions],
  );
  const deliveryInfo = useMemo(
    () =>
      product.deliveryInfo?.length
        ? product.deliveryInfo
        : ["Stokta olan ürünler: 2-3 iş günü içinde teslim.", "Pre-order ürünler: yaklaşık 3-4 hafta teslimat."],
    [product.deliveryInfo],
  );
  const productStory =
    product.productStory?.trim() ||
    "Ürünün kıvrımlı formu ve katmanlı yüzeyi, 3D baskı karakterini görünür kılar. Her parça üretim tekniği nedeniyle küçük doku/fon farklılıkları gösterebilir; bu da ürünü benzersiz hale getirir.";
  const makerStory =
    product.makerStory?.trim() ||
    "Bu koleksiyon, sürdürülebilir tasarım yaklaşımıyla geri dönüştürülmüş hammaddelerden üretilen 3D baskı aydınlatma fikrini merkeze alır. Üretim süreci katman katman ilerlediği için malzeme israfı minimize edilir.";
  const [selectedImage, setSelectedImage] = useState(gallery[0]);
  const [isInCart, setIsInCart] = useState(false);
  const [reviews, setReviews] = useState(product.reviews ?? []);
  const [rating, setRating] = useState(product.rating ?? 0);
  const [reviewCount, setReviewCount] = useState(product.reviewCount ?? 0);
  const [addedToCartCount, setAddedToCartCount] = useState(product.addedToCartCount ?? 0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const soldOut = (product.stock ?? 0) <= 0;

  useEffect(() => {
    setSelectedImage(gallery[0]);
  }, [gallery]);

  useEffect(() => {
    const items = readCartItems();
    setIsInCart(items.some((item) => item.slug === product.slug));
    setIsMember(Boolean(getUserFromSession<{ id: string }>()?.id));
  }, [product.slug]);

  const addToCart = async () => {
    addCartItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: product.image,
      price: product.price,
      variantSku: product.defaultSku ?? "default",
    });
    setIsInCart(true);
    setAddedToCartCount((p) => p + 1);
    try {
      const response = await apiPost<{ addedToCartCount: number }>(`/api/catalog/products/${product.slug}/cart-hit`, {});
      setAddedToCartCount(response.addedToCartCount);
    } catch {
      // Üye değilse sayaç endpointi reddedebilir; local UI çalışmaya devam eder.
    }
  };

  const buyNow = async () => {
    if (!isInCart) {
      await addToCart();
    }
    router.push("/checkout");
  };

  const submitReview = async () => {
    try {
      setSubmittingReview(true);
      const response = await apiPost<{ reviewCount: number; rating: number }>(`/api/catalog/products/${product.slug}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      const session = getUserFromSession<{ email?: string }>();
      const name = session?.email?.split("@")[0] ?? "Üye";
      const nextReview = {
        id: `${product.slug}-${Date.now()}`,
        name,
        rating: reviewRating,
        comment: reviewComment.trim(),
        date: new Date().toISOString().slice(0, 10),
      };
      setReviews((prev) => {
        const withoutMe = prev.filter((r) => r.name !== name);
        return [nextReview, ...withoutMe];
      });
      setReviewCount(response.reviewCount);
      setRating(response.rating);
      setReviewComment("");
    } catch (error) {
      alert((error as Error).message || "Yorum gönderilemedi.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-6 py-12">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-4/5 overflow-hidden rounded-sm border">
            <Image src={selectedImage} alt={product.title} fill className="object-cover" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {gallery.map((img) => (
              <button
                key={img}
                type="button"
                className={cn(
                  "relative aspect-4/3 overflow-hidden rounded-sm border",
                  selectedImage === img ? "border-foreground" : "border-border",
                )}
                onClick={() => setSelectedImage(img)}
              >
                <Image src={img} alt={`${product.title} preview`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">3D-printed in biodegradable plastic</p>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{product.category}</p>
            <h1 className="text-5xl">{product.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn("size-4", i < Math.round(rating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")}
                  />
                ))}
              </div>
              <span>
                {rating.toFixed(1)} ({reviewCount} yorum)
              </span>
            </div>
          </div>

          <p className="text-muted-foreground">
            {product.description ??
              "Katmanli 3D diffusion paneli, ayarlanabilir isik sicakligi ve uzun omurlu LED cekirdegi ile gelir."}
          </p>

          <div className="rounded border bg-muted/20 p-3 text-sm text-muted-foreground">
            {addedToCartCount + (isInCart ? 1 : 0)} kisi bu urunu sepetine ekledi.
          </div>

          <div className="flex items-center gap-3">
            <p className="text-2xl">£{product.price.toFixed(2)}</p>
            {!soldOut ? <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700">In stock</span> : null}
            {soldOut ? <span className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">Sold out</span> : null}
            {!soldOut && isInCart ? (
              <span className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">Sepete eklendi</span>
            ) : null}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className={cn(buttonVariants(), (soldOut || isInCart) && "pointer-events-none opacity-60")}
              onClick={addToCart}
              disabled={soldOut || isInCart}
            >
              {soldOut ? "Sold Out" : isInCart ? "Sepette" : "Sepete Ekle"}
            </button>
            <button type="button" className={cn(buttonVariants({ variant: "outline" }), "px-4")} onClick={() => void buyNow()}>
              Buy now
            </button>
          </div>
        </div>
      </div>

      <section className="space-y-2 border-t pt-6">
        <details open className="rounded border px-3 py-2">
          <summary className="cursor-pointer text-base font-medium">THE PRODUCT</summary>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{productStory}</p>
        </details>
      </section>

      <section className="space-y-2 border-t pt-6">
        <details className="rounded border px-3 py-2">
          <summary className="cursor-pointer text-base font-medium">DIMENSIONS</summary>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {dimensions.map((item) => (
              <div key={item} className="rounded border p-2 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </details>
      </section>

      <section className="space-y-2 border-t pt-6">
        <details className="rounded border px-3 py-2">
          <summary className="cursor-pointer text-base font-medium">DELIVERY</summary>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {deliveryInfo.map((item) => (
              <div key={item} className="rounded border p-2 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </details>
      </section>

      <section className="space-y-2 border-t pt-6">
        <details className="rounded border px-3 py-2">
          <summary className="cursor-pointer text-base font-medium">INFORMATION</summary>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {infoItems.map((item) => (
              <div key={item} className="rounded border p-2 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </details>
      </section>

      <section className="space-y-2 border-t pt-6">
        <details className="rounded border px-3 py-2">
          <summary className="cursor-pointer text-base font-medium">THE MAKER</summary>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{makerStory}</p>
        </details>
      </section>

      <section className="space-y-3 border-t pt-8">
        <h2 className="text-2xl">Yorumlar</h2>
        {isMember ? (
          <div className="space-y-3 rounded border p-3">
            <p className="text-sm text-muted-foreground">Satın aldığınız ürünlerde puan verebilirsiniz. Yorum opsiyoneldir.</p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={5}
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">Puan (1-5)</span>
            </div>
            <Textarea
              rows={3}
              placeholder="İsterseniz yorum ekleyin (opsiyonel)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <button
              type="button"
              className={buttonVariants()}
              onClick={() => {
                void submitReview();
              }}
              disabled={submittingReview}
            >
              {submittingReview ? "Gönderiliyor..." : "Puan / Yorum Gönder"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Puan ve yorum için önce giriş yapmalısınız.</p>
        )}
        {reviews.map((review) => (
          <div key={review.id} className="rounded border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">{review.name}</p>
              <p className="text-xs text-muted-foreground">{review.date}</p>
            </div>
            <div className="mb-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn("size-3.5", i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")}
                />
              ))}
            </div>
            {review.comment ? <p className="text-sm text-muted-foreground">{review.comment}</p> : null}
          </div>
        ))}
      </section>
    </div>
  );
}
