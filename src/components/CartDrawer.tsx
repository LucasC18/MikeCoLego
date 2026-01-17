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
import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

/**
 * Abre WhatsApp de forma robusta.
 * - iOS / Safari: conviene navegación directa.
 * - Otros: intenta usar una ventana pre-abierta (para evitar bloqueo por popup post-await)
 */
const navigateToWhatsApp = (
  url: string,
  preOpenedWindow?: Window | null
): void => {
  const needsDirectNavigation = isIOSDevice() || isSafariBrowser();

  if (needsDirectNavigation) {
    window.location.href = url;
    return;
  }

  if (preOpenedWindow && !preOpenedWindow.closed) {
    try {
      preOpenedWindow.location.href = url;
      preOpenedWindow.focus();
      return;
    } catch {
      // si falla, cae al fallback
    }
  }

  const newWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (!newWindow) {
    window.location.href = url;
  }
};

const getSafeAreaStyle = (): CSSProperties => {
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

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.paddingRight =
      scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isLocked]);
};

/* ================================
   SUB-COMPONENTS
================================= */
const NeonGlow = ({
  color = "cyan",
  className = "",
}: {
  color?: string;
  className?: string;
}) => (
  <div
    className={`absolute inset-0 opacity-20 blur-2xl pointer-events-none ${className}`}
    style={{
      background: `radial-gradient(circle at center, ${
        color === "cyan"
          ? "rgba(34, 211, 238, 0.3)"
          : color === "purple"
          ? "rgba(168, 85, 247, 0.3)"
          : color === "pink"
          ? "rgba(236, 72, 153, 0.3)"
          : color === "green"
          ? "rgba(52, 211, 153, 0.3)"
          : "rgba(34, 211, 238, 0.3)"
      }, transparent 70%)`,
    }}
  />
);

const CartHeader = ({
  itemCount,
  onClose,
}: {
  itemCount: number;
  onClose: () => void;
}) => (
  <SheetHeader className="pb-6 border-b border-slate-700/30 relative">
    <div className="absolute -top-2 -left-2 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl" />
    <div className="absolute -top-2 -right-2 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />

    <SheetTitle className="flex items-center justify-between gap-4 relative">
      <div className="flex items-center gap-3">
        <motion.div
          className="p-3 rounded-2xl bg-slate-800/80 border border-cyan-500/30 relative overflow-hidden group"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <ShoppingBag className="w-6 h-6 text-cyan-400 relative z-10" />
          <div className="absolute inset-0 bg-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
        <div>
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Mi Consulta
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Badge className="px-4 py-2 bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-white border border-cyan-500/30 font-bold text-base shadow-lg shadow-cyan-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/20 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Sparkles className="w-4 h-4 mr-1.5 inline" />
            {itemCount}
          </Badge>
        </motion.div>

        <motion.button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800/60 border border-slate-600/30 hover:border-pink-500/40 text-slate-400 hover:text-pink-400 transition-all duration-300 group relative"
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="w-5 h-5" />
          <div className="absolute inset-0 bg-pink-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
        </motion.button>
      </div>
    </SheetTitle>
  </SheetHeader>
);

const EmptyCart = () => (
  <motion.div
    className="flex-1 flex flex-col items-center justify-center gap-6 py-16"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div
      className="p-10 rounded-3xl bg-slate-800/40 border border-slate-700/40 relative overflow-hidden group"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <NeonGlow
        color="purple"
        className="opacity-0 group-hover:opacity-30 transition-opacity duration-700"
      />
      <ShoppingBag className="w-20 h-20 text-slate-600 relative z-10 group-hover:text-purple-500/50 transition-colors duration-500" />
      <motion.div className="absolute inset-0 border border-purple-500/0 group-hover:border-purple-500/30 rounded-3xl transition-all duration-500" />
    </motion.div>

    <div className="text-center space-y-2 max-w-xs">
      <motion.p
        className="text-xl font-bold text-slate-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Tu consulta está vacía
      </motion.p>
      <motion.p
        className="text-sm text-slate-500 leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Agregá productos para comenzar tu consulta personalizada
      </motion.p>
    </div>
  </motion.div>
);

const CartItemImage = ({ src, alt }: { src?: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex-shrink-0 border border-slate-600/40 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <Package className="w-10 h-10 text-slate-500 relative z-10 group-hover:text-cyan-400/50 transition-colors duration-500" />
      </div>
    );
  }

  return (
    <div className="relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-600/40 group">
      <motion.div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
        } group-hover:scale-110`}
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 border border-cyan-500/0 group-hover:border-cyan-500/30 rounded-2xl transition-all duration-500" />
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
      initial={reduceMotion ? undefined : { opacity: 0, x: -20 }}
      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: 20, scale: 0.9 }}
      transition={
        reduceMotion
          ? undefined
          : {
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: index * 0.05,
            }
      }
      whileHover={reduceMotion ? undefined : { scale: 1.02, x: 4 }}
      className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/40 hover:bg-slate-800/50 hover:border-cyan-500/30 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 left-0 w-1 h-0 bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 group-hover:h-full transition-all duration-500" />

      <CartItemImage src={item.image} alt={item.name} />

      <div className="flex-1 min-w-0 relative z-10">
        <p className="font-bold text-base text-slate-100 line-clamp-2 leading-snug mb-2 group-hover:text-white transition-colors duration-300">
          {item.name}
        </p>
        {item.category && (
          <motion.div whileHover={{ scale: 1.05 }} className="inline-block">
            <Badge
              variant="secondary"
              className="text-xs bg-purple-500/15 text-purple-300 border border-purple-500/30 px-3 py-1 font-medium"
            >
              {item.category}
            </Badge>
          </motion.div>
        )}
      </div>

      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={handleRemove}
          className="min-w-[48px] min-h-[48px] rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 hover:text-pink-300 border border-pink-500/30 hover:border-pink-500/50 transition-all flex-shrink-0 touch-manipulation relative overflow-hidden group/btn"
          aria-label={`Eliminar ${item.name}`}
        >
          <div className="absolute inset-0 bg-pink-400/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
          <Trash2 className="w-5 h-5 relative z-10" />
        </Button>
      </motion.div>
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
  <div className="pt-6 border-t border-slate-700/30 space-y-3 relative">
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-20 bg-cyan-500/5 blur-3xl" />

    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={onWhatsAppClick}
        disabled={isLoading}
        size="lg"
        className="relative w-full h-16 text-lg font-bold overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:from-emerald-500 hover:to-green-500 text-white border-0 shadow-2xl shadow-emerald-500/30 touch-manipulation disabled:opacity-50 transition-all duration-300 group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <div className="absolute inset-0 bg-emerald-400/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {isLoading ? (
          <motion.div
            className="flex items-center relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
            Enviando consulta…
          </motion.div>
        ) : (
          <span className="flex items-center relative z-10">
            <MessageCircle className="w-6 h-6 mr-2" />
            Consultar por WhatsApp
          </span>
        )}
      </Button>
    </motion.div>

    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        variant="outline"
        onClick={onClearClick}
        size="lg"
        className="w-full h-14 text-base font-bold bg-slate-800/40 hover:bg-pink-500/10 text-slate-300 hover:text-pink-300 border border-slate-700/40 hover:border-pink-500/40 transition-all duration-300 touch-manipulation relative overflow-hidden group"
        aria-label="Vaciar consulta"
      >
        <div className="absolute inset-0 bg-pink-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <Trash2 className="w-5 h-5 mr-2 relative z-10" />
        <span className="relative z-10">Vaciar consulta</span>
      </Button>
    </motion.div>
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
    <AlertDialogContent className="bg-slate-900/98 backdrop-blur-2xl border border-slate-700/50 max-w-md relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />

      <AlertDialogHeader className="relative z-10">
        <AlertDialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
          <motion.div
            className="p-3 rounded-xl bg-pink-500/15 border border-pink-500/30 relative overflow-hidden"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <div className="absolute inset-0 bg-pink-400/20 blur-xl opacity-50" />
            <Trash2 className="w-6 h-6 text-pink-400 relative z-10" />
          </motion.div>
          <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
            ¿Vaciar consulta?
          </span>
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-slate-400 leading-relaxed pt-3 pl-1">
          Se eliminarán todos los productos de tu consulta. Esta acción no se
          puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="gap-3 sm:gap-3 relative z-10">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1"
        >
          <AlertDialogCancel className="w-full h-12 text-sm font-bold bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50 hover:border-slate-600 touch-manipulation transition-all duration-300">
            Cancelar
          </AlertDialogCancel>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1"
        >
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full h-12 text-sm font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white touch-manipulation transition-all duration-300 shadow-lg shadow-pink-500/30 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative z-10">Vaciar todo</span>
          </AlertDialogAction>
        </motion.div>
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

  const itemCount = useMemo(() => items.length, [items]);
  const isEmpty = useMemo(() => items.length === 0, [items]);

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

    /**
     * ✅ CLAVE: abrir ventana ANTES del await para evitar bloqueo de popups.
     * Solo aplica en navegadores donde no conviene navegación directa (iOS/Safari).
     */
    let preOpenedWindow: Window | null = null;
    const needsDirectNavigation = isIOSDevice() || isSafariBrowser();
    if (!needsDirectNavigation) {
      preOpenedWindow = window.open("about:blank", "_blank", "noopener,noreferrer");
      // si el popup fue bloqueado, quedará null; tenemos fallback luego
    }

    setIsLoading(true);

    try {
      const consultationItems: ConsultationItem[] = items.map((item) => ({
        productId: item.id,
        qty: item.quantity ?? 1,
      }));

      const response = await createConsultation(consultationItems);

      if (!response?.whatsappMessage) {
        throw new Error("No se pudo generar el mensaje de WhatsApp");
      }

      const phone = formatPhoneNumber(WHATSAPP_NUMBER);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
        response.whatsappMessage
      )}`;

      navigateToWhatsApp(whatsappUrl, preOpenedWindow);

      setTimeout(() => {
        clearCart();
        onClose();
      }, CLEAR_CART_DELAY);

      toast({
        description: (
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
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
      // si pre-abrimos ventana y falló el request, no la dejamos colgada
      if (preOpenedWindow && !preOpenedWindow.closed) {
        try {
          preOpenedWindow.close();
        } catch {
          // no pasa nada
        }
      }

      const errorMessage = extractErrorMessage(err);
      toast({
        title: "❌ Error al enviar",
        description:
          errorMessage || "No se pudo enviar la consulta. Intentá nuevamente.",
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
            <Trash2 className="w-5 h-5 text-pink-400" />
            <div>
              <p className="text-sm font-semibold text-white">
                Producto eliminado
              </p>
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
          <CheckCircle2 className="w-5 h-5 text-purple-400" />
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
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <SheetContent
          className="w-full sm:max-w-lg flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 backdrop-blur-xl border-l border-slate-700/40 relative overflow-hidden"
          style={getSafeAreaStyle()}
        >
          {/* Ambient background effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-cyan-500/5 via-transparent to-pink-500/5 pointer-events-none" />

          <CartHeader itemCount={itemCount} onClose={onClose} />

          {isEmpty ? (
            <EmptyCart />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-6 space-y-3 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent hover:scrollbar-thumb-slate-600/50 transition-colors">
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
