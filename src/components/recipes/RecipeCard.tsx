import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  Heart,
  ChefHat,
  ShoppingCart,
  Trash2,
  Pencil,
} from "lucide-react";
import { Recipe, CATEGORIES, DIFFICULTY_LABELS } from "@/types/recipe";
import { useRecipes } from "@/contexts/RecipeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

export function RecipeCard({ recipe, index }: RecipeCardProps) {
  const navigate = useNavigate();
  const { toggleFavorite, addToShoppingList, shoppingList, deleteRecipe } =
    useRecipes();
  const isInShoppingList = shoppingList.some(
    (item) => item.recipeId === recipe.id,
  );

  const categoryLabels = (recipe.categories ?? [])
    .map((catId) => CATEGORIES.find((c) => c.id === catId))
    .filter(Boolean);

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation();
    void addToShoppingList(recipe.id, recipe.title).then(() => {
      toast.success(`${recipe.title} adicionada à lista de compras!`);
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir "${recipe.title}"?`)) {
      void deleteRecipe(recipe.id).then(() => {
        toast.success("Receita excluída com sucesso!");
      });
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    void toggleFavorite(recipe.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={() => navigate(`/receita/${recipe.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-300 hover:shadow-card-hover"
    >
      {/* Image placeholder with gradient */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-secondary">
        <div className="absolute inset-0 flex items-center justify-center">
          <ChefHat className="h-16 w-16 text-primary/30" />
        </div>

        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-transform hover:scale-110"
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-colors",
              recipe.isFavorite
                ? "fill-destructive text-destructive"
                : "text-muted-foreground",
            )}
          />
        </button>

        <div className="absolute left-3 top-3 flex gap-2 opacity-0 transition-all group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/receita/${recipe.id}/editar`);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all hover:scale-110"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all hover:scale-110 hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Categories */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
          {categoryLabels.map((cat) => (
            <span
              key={cat!.id}
              className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium backdrop-blur-sm"
            >
              {cat!.icon} {cat!.label}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Meta info */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {recipe.prepTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {recipe.prepTime} min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {recipe.servings} porções
            </span>
          )}
          {recipe.difficulty && (
            <span className="rounded-full bg-secondary px-2 py-0.5">
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4">
          <Button
            variant={isInShoppingList ? "secondary" : "default"}
            size="sm"
            className="w-full gap-2"
            onClick={handleAddToList}
            disabled={isInShoppingList}
          >
            <ShoppingCart className="h-4 w-4" />
            {isInShoppingList ? "Na lista" : "Adicionar à lista"}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
