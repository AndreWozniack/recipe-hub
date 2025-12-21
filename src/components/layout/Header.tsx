import { Link, useLocation } from 'react-router-dom';
import { ChefHat, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecipes } from '@/contexts/RecipeContext';
import { motion } from 'framer-motion';

export function Header() {
  const location = useLocation();
  const { shoppingList } = useRecipes();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground">
            Minhas Receitas
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/nova-receita">
            <Button
              variant={location.pathname === '/nova-receita' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Receita</span>
            </Button>
          </Link>
          
          <Link to="/lista-de-compras">
            <Button
              variant={location.pathname === '/lista-de-compras' ? 'default' : 'ghost'}
              size="sm"
              className="relative gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Lista de Compras</span>
              {shoppingList.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground"
                >
                  {shoppingList.length}
                </motion.span>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
