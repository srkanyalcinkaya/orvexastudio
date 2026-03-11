"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { accountRequest } from "@/lib/account-api";
import { setSession } from "@/lib/session";

type Profile = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  roles: string[];
};

export function ProfileSection() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ fullName: "", phone: "" });
  const profile = useQuery({
    queryKey: ["account-profile"],
    queryFn: () => accountRequest<Profile>("/api/account/profile"),
  });

  useEffect(() => {
    if (profile.data) {
      setForm({ fullName: profile.data.fullName ?? "", phone: profile.data.phone ?? "" });
    }
  }, [profile.data]);

  const mutation = useMutation({
    mutationFn: () => accountRequest<Profile>("/api/account/profile", { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: (data) => {
      setSession(localStorage.getItem("orvexa_access_token") ?? "", { id: data.id, email: data.email, roles: data.roles });
      void qc.invalidateQueries({ queryKey: ["account-profile"] });
      toast.success("Profil güncellendi.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={profile.data?.email ?? ""} disabled />
        <Input placeholder="Ad Soyad" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
        <Input placeholder="Telefon" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          Kaydet
        </Button>
      </CardContent>
    </Card>
  );
}
