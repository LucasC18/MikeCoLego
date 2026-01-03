import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const DEBOUNCE_MS = 300;

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  const [localValue, setLocalValue] = useState(value);

  // Mantener sincronizado si se limpia desde afuera
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce
  useEffect(() => {
    const id = setTimeout(() => {
      onChange(localValue);
    }, DEBOUNCE_MS);

    return () => clearTimeout(id);
  }, [localValue, onChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative w-full max-w-md"
    >
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
        aria-hidden="true"
      />

      <Input
        type="text"
        placeholder="Buscar personajes..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        aria-label="Buscar productos LEGO"
        className="pl-12 pr-10 py-6 bg-card/50 border-primary/20 focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground neon-border"
      />

      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Limpiar búsqueda"
          onClick={() => setLocalValue("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
};

export default SearchBar;
