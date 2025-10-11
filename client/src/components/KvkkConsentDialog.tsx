import { useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface KvkkConsentDialogProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline?: () => void;
}

export default function KvkkConsentDialog({ isOpen, onAccept, onDecline }: KvkkConsentDialogProps) {
  useEffect(() => {
    // prevent background scroll when open; Radix overlay already blocks interaction
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>KVKK Aydınlatma ve Açık Rıza</AlertDialogTitle>
          <AlertDialogDescription>
            Uygulamayı kullanmaya başlamadan önce, konum bilgileriniz, mikrofon verileriniz (ses),
            sohbet geçmişiniz, kullanım bilgileriniz ve güvenlik için gerekli teknik günlük kayıtları işlenecektir. 
            Bu veriler; acil durumlarda yardım sağlamak, öneriler sunmak, tarife önerileri oluşturmak ve 
            hizmet kalitesini artırmak amacıyla işlenecek ve saklanacaktır. Devam ederek KVKK kapsamında 
            aydınlatma metnini okuduğunuzu ve açık rıza verdiğinizi beyan edersiniz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            - Konum: En yakın yardım ve bildirimler için kullanılacaktır.
          </p>
          <p>
            - Mikrofon/Ses: Sadece sizin başlattığınız sesli komutlar sırasında işlenecektir.
          </p>
          <p>
            - Sohbet Geçmişi: Deneyiminizi kişiselleştirmek ve güvenlik amaçlı tutulacaktır.
          </p>
          <p>
            - Kullanım Bilgileri: Tarife önerileri oluşturmak için veri, dakika ve SMS kullanım verileriniz işlenecektir.
          </p>
          <p>
            Onay vermeden uygulamaya devam edilemez.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDecline}>Reddet</AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>Kabul Ediyorum</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


