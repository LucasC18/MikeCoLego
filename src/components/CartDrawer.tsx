import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, MessageCircle, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeFromCart, clearCart } = useCart();

  const generateWhatsAppMessage = () => {
    if (items.length === 0) return "";

    const productList = items
      .map((item, index) => `${index + 1}. ${item.name} (${item.category})`)
      .join("\n");

    const message = `¡Hola! 👋 Me gustaría consultar por los siguientes sets de LEGO:\n\n${productList}\n\n¿Podrían darme más información sobre disponibilidad y precios? ¡Gracias!`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = "5491123456789"; // Replace with actual phone number
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-primary/20 flex flex-col">
        <SheetHeader className="border-b border-primary/20 pb-4">
          <SheetTitle className="font-display text-xl flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <span className="text-foreground">Mi Consulta</span>
            <span className="text-primary">({items.length})</span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4"
            >
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </motion.div>
            <h4 className="font-display font-semibold text-lg mb-2">
              Tu consulta está vacía
            </h4>
            <p className="text-muted-foreground text-sm">
              Agrega productos para consultar por WhatsApp
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex items-center gap-3 p-3 glass-card rounded-lg"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-secondary">{item.category}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="border-t border-primary/20 pt-4 space-y-3">
              <Button
                onClick={handleWhatsAppClick}
                className="w-full py-6 bg-neon-green text-neon-green-foreground font-display font-bold text-lg hover:bg-neon-green/90"
                style={{
                  backgroundColor: "#25D366",
                  color: "white",
                  boxShadow: "0 0 20px rgba(37, 211, 102, 0.4)",
                }}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Consultar por WhatsApp
              </Button>

              <Button
                variant="outline"
                onClick={clearCart}
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vaciar consulta
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
