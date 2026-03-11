"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function DeleteDialog({
  label,
  onConfirm,
}: {
  label: string;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>Sil</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label} silinsin mi?</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Evet, sil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
