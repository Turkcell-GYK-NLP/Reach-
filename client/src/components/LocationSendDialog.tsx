import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MapPin, Send } from "lucide-react";

interface LocationSendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  location?: string;
  isLoading?: boolean;
}

export default function LocationSendDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  location = "Konum bilgisi alınıyor...",
  isLoading = false 
}: LocationSendDialogProps) {
  const handleSend = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl text-blue-600">Konum Gönder</AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2">
                Mevcut konumunuz acil durum kişilerine gönderilecek. 
                <br />
                <span className="font-medium text-gray-700">
                  Konum: {location}
                </span>
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            İptal
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSend}
            disabled={isLoading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Konumu Gönder
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
