import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User, Heart, Shield, Zap, Users } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 text-white p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">REACH+</h1>
              <p className="text-blue-100">Akıllı Destek Servisi</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            {mode === "register" ? "Hesabınızı Oluşturun" : "Hoş Geldiniz"}
          </h2>
          
          <p className="text-blue-100 text-lg mb-8">
            {mode === "register" 
              ? "Acil durumlarda size en iyi desteği sunan AI destekli platforma katılın"
              : "Acil durumlarda size en iyi desteği sunan AI destekli platforma giriş yapın"
            }
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-blue-100">7/24 Güvenlik ve Destek</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-blue-100">Anlık Acil Durum Bildirimleri</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-blue-100">Topluluk Desteği</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center">
              <Heart className="text-white" size={32} />
            </div>
          </div>

          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-800">
                {mode === "register" ? "Hesap Oluştur" : "Giriş Yap"}
              </CardTitle>
              <p className="text-gray-600 mt-2">
                {mode === "register" 
                  ? "Hesabınızı oluşturun ve başlayın" 
                  : "Hesabınıza giriş yapın"
                }
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {mode === "register" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Ad Soyad</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input 
                      placeholder="Adınız ve soyadınız" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="ornek@email.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Şifrenizi girin" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02]" 
                onClick={onSubmit} 
                disabled={registerMutation.isPending || loginMutation.isPending}
              >
                {registerMutation.isPending || loginMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>İşleniyor...</span>
                  </div>
                ) : (
                  mode === "register" ? "Hesap Oluştur" : "Giriş Yap"
                )}
              </Button>

              <div className="text-center">
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  onClick={() => setMode(mode === "register" ? "login" : "register")}
                >
                  {mode === "register" 
                    ? "Zaten hesabınız var mı? Giriş yapın" 
                    : "Hesabınız yok mu? Kayıt olun"
                  }
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>© 2024 REACH+. Tüm hakları saklıdır.</p>
            <p className="mt-1">Gizlilik Politikası | Kullanım Şartları</p>
          </div>
        </div>
      </div>
    </div>
  );
}


