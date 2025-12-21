import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Copy, Check, ArrowLeft, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useRecipes } from '@/contexts/RecipeContext';
import { toast } from 'sonner';

export function ShoppingList() {
  const navigate = useNavigate();
  const {
    shoppingList,
    removeFromShoppingList,
    clearShoppingList,
    getShoppingListIngredients,
  } = useRecipes();

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const ingredients = getShoppingListIngredients();

  const handleToggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyList = () => {
    const listText = ingredients
      .map((ing) => `☐ ${ing.quantity} ${ing.unit} - ${ing.name}`)
      .join('\n');
    
    navigator.clipboard.writeText(listText);
    toast.success('Lista copiada para a área de transferência!');
  };

  const handleClearList = () => {
    if (confirm('Tem certeza que deseja limpar toda a lista de compras?')) {
      clearShoppingList();
      setCheckedItems(new Set());
      toast.success('Lista de compras limpa!');
    }
  };

  if (shoppingList.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">
          Lista de Compras Vazia
        </h2>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Adicione receitas à sua lista de compras para gerar uma lista unificada de ingredientes.
        </p>
        <Button className="mt-6 gap-2" onClick={() => navigate('/')}>
          <Plus className="h-4 w-4" />
          Explorar Receitas
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Lista de Compras
          </h1>
          <p className="text-muted-foreground">
            {shoppingList.length} receita{shoppingList.length !== 1 && 's'} • {ingredients.length} ingrediente{ingredients.length !== 1 && 's'}
          </p>
        </div>
      </div>

      {/* Selected Recipes */}
      <div className="rounded-2xl bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Receitas Selecionadas
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {shoppingList.map((item) => (
              <motion.div
                key={item.recipeId}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm"
              >
                <span>{item.recipeName}</span>
                <button
                  onClick={() => removeFromShoppingList(item.recipeId)}
                  className="rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="rounded-2xl bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Lista Unificada
          </h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopyList} className="gap-2">
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearList}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </div>

        <div className="mt-4 divide-y divide-border">
          <AnimatePresence>
            {ingredients.map((ingredient, index) => {
              const isChecked = checkedItems.has(ingredient.id);
              return (
                <motion.div
                  key={ingredient.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 py-3"
                >
                  <Checkbox
                    id={ingredient.id}
                    checked={isChecked}
                    onCheckedChange={() => handleToggleItem(ingredient.id)}
                  />
                  <label
                    htmlFor={ingredient.id}
                    className={`flex-1 cursor-pointer transition-all ${
                      isChecked ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}
                  >
                    <span className="font-medium">
                      {ingredient.quantity} {ingredient.unit}
                    </span>
                    {' - '}
                    {ingredient.name}
                  </label>
                  {isChecked && (
                    <Check className="h-4 w-4 text-accent" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-2xl bg-card p-6 shadow-card">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium text-foreground">
            {checkedItems.size} de {ingredients.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{
              width: `${(checkedItems.size / ingredients.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
