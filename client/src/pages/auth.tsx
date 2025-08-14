import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Eğer kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
  React.useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "null");
      if (auth?.user?.id) {
        window.location.href = "/";
      }
    } catch {}
  }, []);

  const registerMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) => api.register(data),
    onSuccess: (res) => {
      localStorage.setItem("auth", JSON.stringify(res));
      window.location.href = "/";
    },
    onError: (e: any) => setError(e?.message || "Kayıt başarısız"),
  });

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => api.login(data),
    onSuccess: (res) => {
      localStorage.setItem("auth", JSON.stringify(res));
      window.location.href = "/";
    },
    onError: (e: any) => setError(e?.message || "Giriş başarısız"),
  });

  const onSubmit = () => {
    setError(null);
    if (mode === "register") {
      registerMutation.mutate({ name, email, password });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === "register" ? "Kayıt Ol" : "Giriş Yap"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mode === "register" && (
            <Input placeholder="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <Input placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button className="w-full bg-trust" onClick={onSubmit} disabled={registerMutation.isPending || loginMutation.isPending}>
            {mode === "register" ? "Kayıt Ol" : "Giriş Yap"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setMode(mode === "register" ? "login" : "register")}
          >
            {mode === "register" ? "Zaten hesabın var mı? Giriş Yap" : "Hesabın yok mu? Kayıt Ol"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


