"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { accountRequest } from "@/lib/account-api";

type MyReview = {
  id: string;
  productSlug: string;
  productTitle: string;
  heroImage: string;
  rating: number;
  comment?: string;
  date: string;
};

export function ReviewsSection() {
  const reviews = useQuery({
    queryKey: ["account-reviews"],
    queryFn: () => accountRequest<MyReview[]>("/api/account/reviews"),
  });

  if (reviews.isLoading) return <p className="text-sm text-muted-foreground">Yorumlar yükleniyor...</p>;

  return (
    <div className="space-y-3">
      {reviews.data?.length ? (
        reviews.data.map((review) => (
          <Card key={review.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="relative h-16 w-16 overflow-hidden rounded border">
                <Image src={review.heroImage} alt={review.productTitle} fill className="object-cover" />
              </div>
              <div className="flex-1 text-sm">
                <Link href={`/product/${review.productSlug}`} className="font-medium hover:underline">
                  {review.productTitle}
                </Link>
                <p className="text-muted-foreground">Puan: {review.rating}/5 - {review.date}</p>
                {review.comment ? <p className="text-muted-foreground">{review.comment}</p> : null}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Henüz yorumunuz yok.</CardContent>
        </Card>
      )}
    </div>
  );
}
