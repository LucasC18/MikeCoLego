import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";

/* ================================
   📞 WhatsApp desde .env
   ================================ */
const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE as string | undefined;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { name: "Inicio", path: "/" },
    { name: "Catálogo", path: "/catalogo" },
    { name: "Sobre Nosotros", path: "/nosotros" }
  ];

  return (
    <footer className="relative mt-24">
      {/* Decorative divider with glow effect */}
      <div className="absolute top-0 left-0 right-0 h-px">
        <div className="h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute inset-0 blur-sm bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-card border-t border-primary/10"
      >
        <div className="container mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
            
            {/* Brand Section */}
            <div className="space-y-5">
              <Link to="/" className="inline-block group">
                <h3 className="font-display text-2xl font-bold transition-all">
                  Jedi<span className="text-gradient group-hover:opacity-80 transition-opacity">Collector71</span>
                </h3>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
                Tienda de exhibición especializada en personajes exclusivos. 
                Explorá nuestra colección y consultá disponibilidad directamente.
              </p>
            </div>

            {/* Navigation Section */}
            <div className="space-y-5">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Navegación
              </h4>
              <nav>
                <ul className="space-y-3">
                  {navigationLinks.map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center group"
                      >
                        <span className="relative">
                          {link.name}
                          <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all duration-200 group-hover:w-full" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Contact Section */}
            <div className="space-y-5">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Contacto
              </h4>
              
              <div className="space-y-3.5">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary/70" />
                  <span className="leading-relaxed">
                    Buenos Aires, Argentina
                  </span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary/10 bg-background/30">
          <div className="container mx-auto px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
              <p className="text-center sm:text-left">
                © {currentYear} JediCollector71. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;