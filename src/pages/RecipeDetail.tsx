import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Users,
  Heart,
  ChefHat,
  ShoppingCart,
  Pencil,
  Trash2,
  Download,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareRecipeDialog } from "@/components/recipes/ShareRecipeDialog";
import { useRecipes } from "@/contexts/RecipeContext";
import { CATEGORIES, DIFFICULTY_LABELS } from "@/types/recipe";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportRecipeToPDF } from "@/lib/exportPDF";
import { Header } from "@/components/layout/Header";

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    recipes,
    loading,
    deleteRecipe,
    toggleFavorite,
    addToShoppingList,
    shoppingList,
  } = useRecipes();

  const recipeIndex = useMemo(
    () => recipes.findIndex((item) => item.id === id),
    [id, recipes],
  );
  const recipe = recipeIndex >= 0 ? recipes[recipeIndex] : null;
  const previousRecipe = recipeIndex > 0 ? recipes[recipeIndex - 1] : null;
  const nextRecipe =
    recipeIndex >= 0 && recipeIndex < recipes.length - 1
      ? recipes[recipeIndex + 1]
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-8">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-8 text-center">
          <p className="text-muted-foreground">Receita não encontrada</p>
          <Button onClick={() => navigate("/")}>Voltar para receitas</Button>
        </div>
      </div>
    );
  }

  const isInShoppingList = shoppingList.some(
    (item) => item.recipeId === recipe.id,
  );
  const categoryLabels = (recipe.categories ?? [])
    .map((catId) => CATEGORIES.find((category) => category.id === catId))
    .filter(Boolean);

  const handleExportPDF = () => {
    exportRecipeToPDF(recipe);
    toast.success("Receita pronta para exportar como PDF!");
  };

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir "${recipe.title}"?`)) {
      await deleteRecipe(recipe.id);
      toast.success("Receita excluída com sucesso!");
      navigate("/");
    }
  };

  const handleAddToList = async () => {
    await addToShoppingList(recipe.id, recipe.title);
    toast.success(`${recipe.title} adicionada à lista de compras!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" className="w-fit gap-2" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
              Voltar para receitas
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="gap-2"
                onClick={() => navigate(`/receita/${recipe.id}/fazer`)}
              >
                <PlayCircle className="h-4 w-4" />
                Fazer receita
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <ShareRecipeDialog recipe={recipe} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/receita/${recipe.id}/editar`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Receita {recipeIndex + 1} de {recipes.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Navegue entre receitas sem voltar para a lista
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    previousRecipe && navigate(`/receita/${previousRecipe.id}`)
                  }
                  disabled={!previousRecipe}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => nextRecipe && navigate(`/receita/${nextRecipe.id}`)}
                  disabled={!nextRecipe}
                >
                  Próxima
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary">
            <div className="flex h-56 items-center justify-center">
              <ChefHat className="h-24 w-24 text-primary/30" />
            </div>
            <button
              onClick={() => toggleFavorite(recipe.id)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-transform hover:scale-110"
            >
              <Heart
                className={cn(
                  "h-6 w-6 transition-colors",
                  recipe.isFavorite
                    ? "fill-destructive text-destructive"
                    : "text-muted-foreground",
                )}
              />
            </button>
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              {categoryLabels.map((cat) => (
                <span
                  key={cat!.id}
                  className="rounded-full bg-background/80 px-3 py-1 text-sm font-medium backdrop-blur-sm"
                >
                  {cat!.icon} {cat!.label}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-foreground">
              {recipe.title}
            </h1>
            {recipe.description && (
              <p className="text-lg text-muted-foreground">{recipe.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            {recipe.prepTime && (
              <span className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
                <Clock className="h-4 w-4" />
                {recipe.prepTime} min
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
                <Users className="h-4 w-4" />
                {recipe.servings} porções
              </span>
            )}
            {recipe.difficulty && (
              <span className="rounded-full bg-primary/10 px-4 py-2 text-primary">
                {DIFFICULTY_LABELS[recipe.difficulty]}
              </span>
            )}
          </div>

          <Button
            variant={isInShoppingList ? "secondary" : "default"}
            className="w-full gap-2"
            onClick={handleAddToList}
            disabled={isInShoppingList}
          >
            <ShoppingCart className="h-4 w-4" />
            {isInShoppingList
              ? "Já está na lista de compras"
              : "Adicionar à lista de compras"}
          </Button>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-2xl bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
                Ingredientes
              </h2>
              <ul className="space-y-2">
                {(recipe.ingredients ?? []).map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="flex items-center gap-2 text-foreground"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>
                      {ingredient.quantity && <strong>{ingredient.quantity}</strong>}{" "}
                      {ingredient.unit && <span>{ingredient.unit}</span>}{" "}
                      {ingredient.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
                Modo de Preparo
              </h2>
              <div className="whitespace-pre-line leading-relaxed text-foreground">
                {recipe.instructions}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
