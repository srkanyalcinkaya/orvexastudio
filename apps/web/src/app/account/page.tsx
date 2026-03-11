"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserPanelShell } from "@/components/account/user-panel-shell";
import { apiPost } from "@/lib/api";
import { clearSession, getAccessToken, getUserFromSession, setSession } from "@/lib/session";

export default function AccountPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedUser, setLoggedUser] = useState<{ id: string; email: string; roles: string[] } | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const user = getUserFromSession<{ id: string; email: string; roles: string[] }>();
    if (token && user) setLoggedUser(user);
  }, []);

  const registerMutation = useMutation({
    mutationFn: () =>
      apiPost<{ accessToken: string; user: { id: string; email: string; roles: string[]; fullName?: string } }>(
        "/api/auth/register",
        { fullName, email, password },
      ),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
      toast.success("Kayıt tamamlandı.");
      const nextPath = new URLSearchParams(window.location.search).get("next");
      if (nextPath) {
        router.push(nextPath);
      } else if (data.user.roles.includes("admin")) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    },
    onError: () => toast.error("Kayıt başarısız."),
  });

  const loginMutation = useMutation({
    mutationFn: () =>
      apiPost<{ accessToken: string; user: { id: string; email: string; roles: string[] } }>(
        "/api/auth/login",
        { email, password },
      ),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
      toast.success("Giriş başarılı.");
      const nextPath = new URLSearchParams(window.location.search).get("next");
      if (nextPath) {
        router.push(nextPath);
      } else if (data.user.roles.includes("admin")) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    },
    onError: () => toast.error("Giriş başarısız."),
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-4xl">Account</h1>
      {loggedUser ? (
        <>
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Hesabım</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">{loggedUser.email}</p>
              <div className="flex gap-2">
                {loggedUser.roles.includes("admin") ? (
                  <Button variant="outline" onClick={() => router.push("/admin")}>
                    Admin Panel
                  </Button>
                ) : null}
                <Button
                  variant="destructive"
                  onClick={() => {
                    clearSession();
                    setLoggedUser(null);
                    toast.success("Çıkış yapıldı.");
                  }}
                >
                  Çıkış Yap
                </Button>
              </div>
            </CardContent>
          </Card>
          <UserPanelShell />
        </>
      ) : null}
      {!loggedUser ? (
        <Tabs className="mt-8" defaultValue="signin">
          <TabsList>
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Sign in</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button onClick={() => loginMutation.mutate()} disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ad Soyad</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending || fullName.trim().length < 2}>
                  {registerMutation.isPending ? "Creating..." : "Create account"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
