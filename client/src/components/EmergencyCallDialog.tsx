import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Phone } from "lucide-react";

interface EmergencyCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function EmergencyCallDialog({ isOpen, onClose, onConfirm }: EmergencyCallDialogProps) {
  const handleCall = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl text-red-600">Acil Durum Çağrısı</AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2">
                112 Acil Durum Merkezi aranacak. Devam etmek istiyor musunuz?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            İptal
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCall}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            <Phone className="w-4 h-4 mr-2" />
            112'yi Ara
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
