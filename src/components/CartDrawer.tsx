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
  <SheetHeader className="pb-6 border-b border-slate-700/30 relative">
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <SheetTitle className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.div 
            className="relative p-3 rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border border-violet-500/30"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 blur-xl" />
            <ShoppingBag className="w-5 h-5 text-violet-300 relative z-10" />
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
            Mi Consulta
          </span>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.2 }}
        >
          <Badge className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 text-white border-0 font-bold text-sm shadow-lg shadow-violet-900/30">
            {itemCount}
          </Badge>
        </motion.div>
      </SheetTitle>
    </motion.div>
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
  </SheetHeader>
);

const EmptyCart = () => (
  <motion.div 
    className="flex-1 flex flex-col items-center justify-center gap-6 py-12"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    <motion.div 
      className="relative p-8 rounded-2xl bg-slate-800/20 border border-slate-700/30"
      animate={{ 
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 blur-2xl" />
      <ShoppingBag className="w-20 h-20 text-slate-500 relative z-10" />
    </motion.div>
    <div className="text-center space-y-2">
      <p className="text-lg font-semibold text-white">
        Tu consulta está vacía
      </p>
      <p className="text-sm text-slate-400">Agregá productos para consultar</p>
    </div>
  </motion.div>
);

const CartItemImage = ({ src, alt }: { src?: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-20 h-20 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex-shrink-0 border border-slate-600/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
        <Package className="w-8 h-8 text-slate-400 relative z-10" />
      </div>
    );
  }

  return (
    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-slate-600/30 group">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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

  if (reduceMotion) {
    return (
      <div key={item.id} className="group relative">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-fuchsia-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <CartItemImage src={item.image} alt={item.name} />

          <div className="flex-1 min-w-0 relative z-10">
            <p className="font-semibold text-sm text-white line-clamp-2 leading-snug mb-2">
              {item.name}
            </p>
            {item.category && (
              <Badge
                variant="secondary"
                className="text-xs bg-violet-500/20 text-violet-200 border-violet-500/30 font-medium"
              >
                {item.category}
              </Badge>
            )}
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleRemove}
            className="min-w-[44px] min-h-[44px] rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-500/50 transition-all flex-shrink-0 touch-manipulation relative z-10"
            aria-label={`Eliminar ${item.name}`}
          >
            <Trash2 className="w-4.5 h-4.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      transition={{
        delay: index * 0.06,
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1]
      }}
      layout
      className="group relative"
    >
      <motion.div
        className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm relative overflow-hidden"
        whileHover={{ 
          scale: 1.01,
          borderColor: "rgba(139, 92, 246, 0.3)",
          transition: { duration: 0.2 }
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-fuchsia-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CartItemImage src={item.image} alt={item.name} />

        <div className="flex-1 min-w-0 relative z-10">
          <p className="font-semibold text-sm text-white line-clamp-2 leading-snug mb-2">
            {item.name}
          </p>
          {item.category && (
            <Badge
              variant="secondary"
              className="text-xs bg-violet-500/20 text-violet-200 border-violet-500/30 font-medium"
            >
              {item.category}
            </Badge>
          )}
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRemove}
            className="min-w-[44px] min-h-[44px] rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-500/50 transition-all flex-shrink-0 touch-manipulation relative z-10"
            aria-label={`Eliminar ${item.name}`}
          >
            <Trash2 className="w-4.5 h-4.5" />
          </Button>
        </motion.div>
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
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
    
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        onClick={onWhatsAppClick}
        disabled={isLoading}
        size="lg"
        className="relative w-full h-14 text-base font-bold overflow-hidden bg-gradient-to-r from-emerald-600/90 to-green-600/90 hover:from-emerald-500/90 hover:to-green-500/90 text-white border-0 shadow-xl shadow-emerald-900/40 touch-manipulation disabled:opacity-50 transition-all duration-300 group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
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
    </motion.div>

    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        variant="outline"
        onClick={onClearClick}
        size="lg"
        className="w-full h-12 text-base font-semibold bg-slate-800/30 hover:bg-rose-500/15 text-slate-300 hover:text-rose-200 border-slate-700/30 hover:border-rose-500/40 transition-all duration-300 touch-manipulation"
        aria-label="Vaciar consulta"
      >
        <Trash2 className="w-4.5 h-4.5 mr-2" />
        Vaciar consulta
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
    <AlertDialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/40 max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-xl font-bold text-white flex items-center gap-3">
          <motion.div 
            className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(244, 63, 94, 0)",
                "0 0 0 8px rgba(244, 63, 94, 0)",
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <Trash2 className="w-5 h-5 text-rose-300" />
          </motion.div>
          ¿Vaciar consulta?
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-slate-400 leading-relaxed pt-3">
          Se eliminarán todos los productos de tu consulta. Esta acción no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="gap-3 sm:gap-3 pt-2">
        <motion.div 
          className="flex-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AlertDialogCancel className="w-full h-11 text-sm font-semibold bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/40 hover:border-slate-600/60 touch-manipulation transition-all duration-200">
            Cancelar
          </AlertDialogCancel>
        </motion.div>
        <motion.div 
          className="flex-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-rose-600/90 to-red-600/90 hover:from-rose-500/90 hover:to-red-500/90 text-white touch-manipulation shadow-lg shadow-rose-900/30 transition-all duration-200"
          >
            Vaciar
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
            <div className="bg-emerald-500/25 p-2.5 rounded-xl border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-200">
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
            <div className="bg-rose-500/25 p-2 rounded-lg border border-rose-500/30">
              <Trash2 className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Producto eliminado</p>
              <p className="text-xs text-slate-400 line-clamp-1">{name}</p>
            </div>
          </div>
        ),
        duration: TOAST_DURATION,
        className: "bg-slate-900/95 backdrop-blur-xl border border-slate-700/40",
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
          <div className="bg-violet-500/25 p-2.5 rounded-xl border border-violet-500/30">
            <CheckCircle2 className="w-5 h-5 text-violet-300" />
          </div>
          <p className="text-sm font-semibold text-white">Consulta vaciada</p>
        </div>
      ),
      duration: TOAST_DURATION,
      className: "bg-slate-900/95 backdrop-blur-xl border border-slate-700/40",
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
          className="w-full sm:max-w-lg flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/95 backdrop-blur-xl border-slate-700/40 relative overflow-hidden"
          style={getSafeAreaStyle()}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full">
            <CartHeader itemCount={itemCount} />

            {isEmpty ? (
              <EmptyCart />
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-5 space-y-3 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent hover:scrollbar-thumb-slate-600/50 transition-colors">
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
          </div>
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