import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Trash2,
  MessageCircle,
  ShoppingBag,
  Loader2,
  Package,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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

/* ================================
   TYPES
================================ */
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItem {
  id: string;
  name: string;
  image?: string;
  category?: string;
  quantity?: number;
}

interface ConsultationItem {
  productId: string;
  qty: number;
}

interface ConsultationResponse {
  whatsappMessage: string;
}

interface ApiError {
  message: string;
}

/* ================================
   CONSTANTS
================================ */
const TOAST_DURATION = 2000;

/* ================================
   HELPERS
================================ */
const formatPhoneNumber = (phone: string): string =>
  phone.replace(/\D/g, "");

/* ================================
   MAIN COMPONENT
================================ */
const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeFromCart, clearCart } = useCart<CartItem>();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion() ?? false;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showClearDialog, setShowClearDialog] = useState<boolean>(false);

  const itemCount = useMemo<number>(() => items.length, [items.length]);
  const isEmpty = itemCount === 0;

  /* ================================
     WHATSAPP HANDLER (FIX REAL)
  ================================ */
  const handleWhatsAppClick = useCallback(async (): Promise<void> => {
    if (isEmpty || !WHATSAPP_NUMBER) return;

    const phone = formatPhoneNumber(WHATSAPP_NUMBER);

    // ✅ Abrimos la pestaña inmediatamente (gesto del usuario)
    const whatsappWindow: Window | null = window.open(
      `https://wa.me/${phone}`,
      "_blank",
      "noopener,noreferrer"
    );

    setIsLoading(true);

    try {
      const consultationItems: ConsultationItem[] = items.map(
        (item): ConsultationItem => ({
          productId: item.id,
          qty: item.quantity ?? 1,
        })
      );

      const response = (await createConsultation(
        consultationItems
      )) as ConsultationResponse;

      if (!response.whatsappMessage) {
        throw new Error("No se pudo generar el mensaje de WhatsApp");
      }

      // ✅ Redirigimos la pestaña ya abierta
      whatsappWindow?.location.replace(
        `https://wa.me/${phone}?text=${encodeURIComponent(
          response.whatsappMessage
        )}`
      );

      clearCart();
      onClose();

      toast({
        description: "Consulta enviada. Abriendo WhatsApp…",
        duration: TOAST_DURATION,
      });
    } catch (error: unknown) {
      whatsappWindow?.close();

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo enviar la consulta";

      toast({
        title: "❌ Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [items, isEmpty, clearCart, onClose, toast]);

  /* ================================
     REMOVE / CLEAR
  ================================ */
  const handleRemove = useCallback(
    (id: string): void => {
      removeFromCart(id);
    },
    [removeFromCart]
  );

  const handleClear = useCallback((): void => {
    clearCart();
    setShowClearDialog(false);
  }, [clearCart]);

  /* ================================
     RENDER
  ================================ */
  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col bg-slate-950">
          <SheetHeader>
            <SheetTitle className="flex justify-between items-center">
              <span className="text-xl font-bold">Mi Consulta</span>
              <Badge>{itemCount}</Badge>
            </SheetTitle>
          </SheetHeader>

          {isEmpty ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              No hay productos en la consulta
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 py-4">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={!reduceMotion ? { opacity: 0, y: 10 } : undefined}
                      animate={!reduceMotion ? { opacity: 1, y: 0 } : undefined}
                      exit={!reduceMotion ? { opacity: 0 } : undefined}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-xl"
                    >
                      <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Package className="text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        {item.category && (
                          <Badge variant="secondary">{item.category}</Badge>
                        )}
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemove(item.id)}
                      >
                        <Trash2 />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  onClick={handleWhatsAppClick}
                  disabled={isLoading}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-500"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2" />
                      Consultar por WhatsApp
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowClearDialog(true)}
                  className="w-full"
                >
                  Vaciar consulta
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Vaciar consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
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
