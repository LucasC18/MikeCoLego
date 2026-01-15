import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Trash2, MessageCircle, ShoppingBag, Loader2, Package, X } from "lucide-react";
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
   TYPES & INTERFACES
================================= */
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

interface ApiError extends Error {
  status?: number;
  code?: string;
}

/* ================================
   CONSTANTS
================================= */
const TOAST_DURATION = 2000;
const CLEAR_CART_DELAY = 500;
const ANIMATION_DURATION = 0.2;
const ITEM_ANIMATION_DELAY = 0.05;

/* ================================
   HELPERS & UTILITIES
================================= */
const isApiError = (error: unknown): error is ApiError => {
  return error instanceof Error;
};

const extractErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message || "No se pudo enviar la consulta";
  }
  if (typeof error === "string") {
    return error;
  }
  return "Error desconocido";
};

const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, "");
};

const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isSafariBrowser = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

const openWhatsApp = (url: string): void => {
  const needsDirectNavigation = isIOSDevice() || isSafariBrowser();

  if (needsDirectNavigation) {
    window.location.href = url;
  } else {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      window.location.href = url;
    }
  }
};

const getSafeAreaStyle = (): React.CSSProperties => {
  return {
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
  };
};

/* ================================
   CUSTOM HOOKS
================================= */
const useScrollLock = (isLocked: boolean) => {
  const scrollPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isLocked) return;

    scrollPositionRef.current = {
      x: window.scrollX,
      y: window.scrollY,
    };

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isLocked]);
};

/* ================================
   SUB-COMPONENTS
================================= */
const CartHeader = ({ itemCount }: { itemCount: number }) => (
  <SheetHeader className="pb-6 border-b border-slate-700/50">
    <SheetTitle className="flex items-center justify-between gap-3 text-slate-100">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10 border border-primary/20">
          <ShoppingBag className="w-6 h-6 text-primary" />
        </div>
        <span className="text-2xl font-bold">Mi Consulta</span>
      </div>
      <Badge className="text-base px-3 py-1.5 bg-primary/20 text-primary border-primary/30">
        {itemCount}
      </Badge>
    </SheetTitle>
  </SheetHeader>
);

const EmptyCart = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12">
    <div className="p-8 rounded-full bg-slate-800/50 border border-slate-700">
      <ShoppingBag className="w-20 h-20 text-slate-500" />
    </div>
    <div className="text-center space-y-2">
      <p className="text-xl font-semibold text-slate-300">
        Tu consulta está vacía
      </p>
      <p className="text-sm text-slate-500">Agregá productos para consultar</p>
    </div>
  </div>
);

const CartItemImage = ({ src, alt }: { src?: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-20 h-20 flex items-center justify-center rounded-lg bg-slate-700/50 flex-shrink-0">
        <Package className="w-10 h-10 text-slate-500" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="w-20 h-20 object-cover rounded-lg shadow-md flex-shrink-0"
      loading="lazy"
      decoding="async"
    />
  );
};

const CartItemCard = ({
  item,
  index,
  onRemove,
  reduceMotion,
}: {
  item: CartItem;
  index: number;
  onRemove: (id: string, name: string) => void;
  reduceMotion: boolean;
}) => {
  const handleRemove = useCallback(() => {
    onRemove(item.id, item.name);
  }, [item.id, item.name, onRemove]);

  return (
    <motion.div
      key={item.id}
      initial={reduceMotion ? undefined : { opacity: 0, x: -20 }}
      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: 20 }}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: ANIMATION_DURATION,
              delay: index * ITEM_ANIMATION_DELAY,
            }
      }
      className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600 transition-all duration-300"
    >
      <CartItemImage src={item.image} alt={item.name} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base text-slate-100 line-clamp-2 leading-snug mb-2">
          {item.name}
        </p>
        {item.category && (
          <Badge
            variant="secondary"
            className="text-xs bg-slate-700/50 text-slate-300 border-slate-600"
          >
            {item.category}
          </Badge>
        )}
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={handleRemove}
        className="min-w-[44px] min-h-[44px] rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors flex-shrink-0 touch-manipulation"
        aria-label={`Eliminar ${item.name}`}
      >
        <Trash2 className="w-5 h-5" />
      </Button>
    </motion.div>
  );
};

const CartActions = ({
  onWhatsAppClick,
  onClearClick,
  isLoading,
}: {
  onWhatsAppClick: () => void;
  onClearClick: () => void;
  isLoading: boolean;
}) => (
  <div className="pt-6 border-t border-slate-700/50 space-y-3">
    <Button
      onClick={onWhatsAppClick}
      disabled={isLoading}
      size="lg"
      className="w-full min-h-[56px] text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation"
      aria-label="Consultar productos por WhatsApp"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Enviando…
        </>
      ) : (
        <>
          <MessageCircle className="w-5 h-5 mr-2" />
          Consultar por WhatsApp
        </>
      )}
    </Button>

    <Button
      variant="outline"
      onClick={onClearClick}
      size="lg"
      className="w-full min-h-[52px] text-base font-semibold bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600 transition-all duration-300 touch-manipulation"
      aria-label="Vaciar consulta"
    >
      <Trash2 className="w-5 h-5 mr-2" />
      Vaciar consulta
    </Button>
  </div>
);

const ClearConfirmDialog = ({
  isOpen,
  onOpenChange,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) => (
  <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700 max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-red-400" />
          ¿Vaciar consulta?
        </AlertDialogTitle>
        <AlertDialogDescription className="text-base text-slate-400 leading-relaxed pt-2">
          Se eliminarán todos los productos de tu consulta. Esta acción no se
          puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="gap-3 sm:gap-3">
        <AlertDialogCancel className="min-h-[52px] text-base bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 touch-manipulation">
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="min-h-[52px] text-base bg-red-600 hover:bg-red-500 text-white touch-manipulation"
        >
          Vaciar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

/* ================================
   MAIN COMPONENT
================================= */
const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const [isLoading, setIsLoading] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useScrollLock(isOpen);

  const itemCount = useMemo(() => items.length, [items.length]);
  const isEmpty = useMemo(() => items.length === 0, [items.length]);

  const handleWhatsAppClick = useCallback(async () => {
    if (isEmpty) return;

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
      const consultationItems: ConsultationItem[] = items.map((item) => ({
        productId: item.id,
        qty: item.quantity ?? 1,
      }));

      const response = await createConsultation(consultationItems);

      if (!response.whatsappMessage) {
        throw new Error("No se pudo generar el mensaje de WhatsApp");
      }

      const phone = formatPhoneNumber(WHATSAPP_NUMBER);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
        response.whatsappMessage
      )}`;

      openWhatsApp(whatsappUrl);

      setTimeout(() => {
        clearCart();
        onClose();
      }, CLEAR_CART_DELAY);

      toast({
        description: "Consulta enviada exitosamente",
        duration: TOAST_DURATION,
        className:
          "bg-emerald-500/90 backdrop-blur-xl border border-emerald-400/50 text-white shadow-xl",
      });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      toast({
        title: "Error al enviar",
        description: errorMessage || "No se pudo enviar la consulta. Intentá nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isEmpty, items, clearCart, onClose, toast]);

  const handleRemove = useCallback(
    (id: string, name: string) => {
      removeFromCart(id);
      toast({
        description: `Producto eliminado: ${name}`,
        duration: TOAST_DURATION,
        className: "bg-slate-900/95 backdrop-blur-md border border-slate-700",
      });
    },
    [removeFromCart, toast]
  );

  const handleClear = useCallback(() => {
    clearCart();
    setShowClearDialog(false);
    toast({
      description: "Consulta vaciada",
      duration: TOAST_DURATION,
      className: "bg-slate-900/95 backdrop-blur-md border border-slate-700",
    });
  }, [clearCart, toast]);

  const handleClearClick = useCallback(() => {
    setShowClearDialog(true);
  }, []);

  const handleDialogChange = useCallback((open: boolean) => {
    setShowClearDialog(open);
  }, []);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          className="w-full sm:max-w-lg flex flex-col bg-slate-900/95 backdrop-blur-xl border-slate-700"
          style={getSafeAreaStyle()}
        >
          <CartHeader itemCount={itemCount} />

          {isEmpty ? (
            <EmptyCart />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-6 space-y-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      onRemove={handleRemove}
                      reduceMotion={!!prefersReducedMotion}
                    />
                  ))}
                </AnimatePresence>
              </div>

              <CartActions
                onWhatsAppClick={handleWhatsAppClick}
                onClearClick={handleClearClick}
                isLoading={isLoading}
              />
            </>
          )}
        </SheetContent>
      </Sheet>

      <ClearConfirmDialog
        isOpen={showClearDialog}
        onOpenChange={handleDialogChange}
        onConfirm={handleClear}
      />
    </>
  );
};

export default CartDrawer;