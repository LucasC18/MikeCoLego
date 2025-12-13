import { motion } from "framer-motion";
import { ShoppingBag, Blocks } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onCartClick: () => void;
}

const Navbar = ({ onCartClick }: NavbarProps) => {
  const { itemCount } = useCart();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-primary/20"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <Blocks className="w-8 h-8 text-primary" />
              <div className="absolute inset-0 blur-lg bg-primary/50" />
            </div>
            <h1 className="font-display text-xl md:text-2xl font-bold neon-text">
              LEGO <span className="text-secondary neon-text-magenta">VAULT</span>
            </h1>
          </motion.div>

          <Button
            variant="outline"
            size="icon"
            onClick={onCartClick}
            className="relative neon-border hover-glow bg-transparent"
          >
            <ShoppingBag className="w-5 h-5 text-primary" />
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full flex items-center justify-center"
              >
                {itemCount}
              </motion.span>
            )}
          </Button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
