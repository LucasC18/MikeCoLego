import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Trash2, MessageCircle, ShoppingBag, Loader2, Package, CheckCircle2 } from "lucide-react";
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
  <SheetHeader className="pb-5 border-b border-slate-700/50">
    <SheetTitle className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
          <ShoppingBag className="w-5 h-5 text-violet-400" />
        </div>
        <span className="text-xl font-bold text-white">
          Mi Consulta
        </span>
      </div>
      <Badge className="px-3 py-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0 font-semibold">
        {itemCount}
      </Badge>
    </SheetTitle>
  </SheetHeader>
);

const EmptyCart = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-5 py-12">
    <div className="p-7 rounded-2xl bg-slate-800/30 border border-slate-700/50">
      <ShoppingBag className="w-16 h-16 text-slate-600" />
    </div>
    <div className="text-center space-y-1.5">
      <p className="text-lg font-semibold text-white">
        Tu consulta está vacía
      </p>
      <p className="text-sm text-slate-400">Agregá productos para consultar</p>
    </div>
  </div>
);

const CartItemImage = ({ src, alt }: { src?: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-20 h-20 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex-shrink-0 border border-slate-600/50">
        <Package className="w-8 h-8 text-slate-500" />
      </div>
    );
  }

  return (
    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-slate-600/50">
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
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
      initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 0.2,
              delay: index * 0.03,
            }
      }
      className="group flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/60 transition-all duration-200"
    >
      <CartItemImage src={item.image} alt={item.name} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white line-clamp-2 leading-snug mb-1.5">
          {item.name}
        </p>
        {item.category && (
          <Badge
            variant="secondary"
            className="text-xs bg-violet-500/15 text-violet-300 border-violet-500/25"
          >
            {item.category}
          </Badge>
        )}
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={handleRemove}
        className="min-w-[44px] min-h-[44px] rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 hover:border-rose-500/40 transition-all flex-shrink-0 touch-manipulation"
        aria-label={`Eliminar ${item.name}`}
      >
        <Trash2 className="w-4.5 h-4.5" />
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
  <div className="pt-5 border-t border-slate-700/50 space-y-2.5">
    <Button
      onClick={onWhatsAppClick}
      disabled={isLoading}
      size="lg"
      className="relative w-full h-14 text-base font-semibold overflow-hidden bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white border-0 shadow-lg shadow-emerald-900/30 touch-manipulation disabled:opacity-50 transition-all duration-200"
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
      className="w-full h-12 text-base font-semibold bg-slate-800/40 hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 border-slate-700/50 hover:border-rose-500/40 transition-all duration-200 touch-manipulation"
      aria-label="Vaciar consulta"
    >
      <Trash2 className="w-4.5 h-4.5 mr-2" />
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
    <AlertDialogContent className="bg-slate-900/98 backdrop-blur-xl border-slate-700/50 max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-xl font-bold text-white flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/25">
            <Trash2 className="w-5 h-5 text-rose-400" />
          </div>
          ¿Vaciar consulta?
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-slate-400 leading-relaxed pt-2">
          Se eliminarán todos los productos de tu consulta. Esta acción no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="gap-2.5 sm:gap-2.5">
        <AlertDialogCancel className="flex-1 h-11 text-sm font-semibold bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/50 hover:border-slate-600 touch-manipulation">
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="flex-1 h-11 text-sm font-semibold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white touch-manipulation"
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
  const prefersReducedMotion = useReducedMotion() || false;

  const [isLoading, setIsLoading] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useScrollLock(isOpen);

  const itemCount = useMemo(() => items.length, [items.length]);
  const isEmpty = useMemo(() => items.length === 0, [items.length]);

  const handleWhatsAppClick = useCallback(async () => {
    if (isEmpty) return;

    if (!WHATSAPP_NUMBER) {
      toast({
        title: "❌ Configuración faltante",
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
        description: (
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-300">
                Consulta enviada
              </p>
              <p className="text-xs text-slate-400">Abriendo WhatsApp...</p>
            </div>
          </div>
        ),
        duration: TOAST_DURATION,
        className: "bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40",
      });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      toast({
        title: "❌ Error al enviar",
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
        description: (
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-rose-400" />
            <div>
              <p className="text-sm font-semibold text-white">Producto eliminado</p>
              <p className="text-xs text-slate-400">{name}</p>
            </div>
          </div>
        ),
        duration: TOAST_DURATION,
        className: "bg-slate-900/95 backdrop-blur-md border border-slate-700/50",
      });
    },
    [removeFromCart, toast]
  );

  const handleClear = useCallback(() => {
    clearCart();
    setShowClearDialog(false);
    toast({
      description: (
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-violet-400" />
          <p className="text-sm font-semibold text-white">Consulta vaciada</p>
        </div>
      ),
      duration: TOAST_DURATION,
      className: "bg-slate-900/95 backdrop-blur-md border border-slate-700/50",
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
          className="w-full sm:max-w-lg flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 backdrop-blur-xl border-slate-700/50"
          style={getSafeAreaStyle()}
        >
          <CartHeader itemCount={itemCount} />

          {isEmpty ? (
            <EmptyCart />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-5 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      onRemove={handleRemove}
                      reduceMotion={prefersReducedMotion}
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