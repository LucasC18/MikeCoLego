import { motion, AnimatePresence } from "framer-motion";
import { Trash2, MessageCircle, ShoppingBag, Loader2, Package, Sparkles } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { createConsultation } from "@/services/consultations.service";
import { WHATSAPP_NUMBER } from "@/config/api";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleWhatsAppClick = async () => {
    if (items.length === 0) return;

    if (!WHATSAPP_NUMBER) {
      toast({
        title: "Configuración faltante",
        description: "No está configurado el número de WhatsApp",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await createConsultation(
        items.map((item) => ({
          productId: item.id,
          qty: item.quantity ?? 1,
        }))
      );

      if (!response.whatsappMessage) {
        throw new Error("No se pudo generar el mensaje de WhatsApp");
      }

      const phone = WHATSAPP_NUMBER.replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
        response.whatsappMessage
      )}`;

      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS || isSafari) {
        window.location.href = whatsappUrl;
      } else {
        const newWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        if (!newWindow) window.location.href = whatsappUrl;
      }

      setTimeout(() => {
        clearCart();
        onClose();
      }, 500);

      toast({
        description: "Consulta enviada exitosamente",
        duration: 2000,
        className:
          "bg-emerald-500/90 backdrop-blur-xl border border-emerald-400/50 text-white shadow-xl",
      });
    } catch (err: unknown) {
      toast({
        title: "Error al enviar",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo enviar la consulta. Intentá nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (id: string, name: string) => {
    removeFromCart(id);
    toast({
      description: `Producto eliminado: ${name}`,
      duration: 2000,
    });
  };

  const handleClear = () => {
    clearCart();
    setShowClearDialog(false);
    toast({
      description: "Consulta vaciada",
      duration: 2000,
    });
  };

  return (
    <>
      {/* FIX CRÍTICO */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6" />
              Mi Consulta ({items.length})
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <ShoppingBag className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground">Tu consulta está vacía</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="w-16 h-16 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      {item.category && (
                        <Badge variant="secondary">{item.category}</Badge>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemove(item.id, item.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleWhatsAppClick}
                disabled={isLoading}
                className="w-full mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Consultar por WhatsApp
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowClearDialog(true)}
                className="w-full mt-2"
              >
                Vaciar consulta
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Vaciar consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todos los productos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear}>
              Vaciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CartDrawer;
