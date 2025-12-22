import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8"
      >
        {/* Número 404 com animação */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-9xl font-bold text-primary/20"
        >
          404
        </motion.div>

        {/* Conteúdo */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Página Não Encontrada
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Desculpe, a página que você está procurando não existe ou foi
            removida.
          </p>
          <p className="text-sm text-muted-foreground">
            Caminho tentado:{" "}
            <code className="bg-muted px-2 py-1 rounded">
              {location.pathname}
            </code>
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button onClick={() => navigate("/")} className="gap-2">
            <Home className="w-4 h-4" />
            Ir para Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
