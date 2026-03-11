"use client";

import { Button } from "@/components/ui/button";

export function TablePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
}) {
  return (
    <div className="flex items-center justify-between pt-3 text-sm">
      <p className="text-muted-foreground">
        Sayfa {page} / {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Önceki
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Sonraki
        </Button>
      </div>
    </div>
  );
}
