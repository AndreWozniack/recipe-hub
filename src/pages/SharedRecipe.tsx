import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Users,
  ChefHat,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getRepository } from "@/data/repositories";
import { Recipe } from "@/types/recipe";
import { useRecipes } from "@/contexts/RecipeContext";

interface SharedRecipeRepository {
  getSharedRecipe(
    shareId: string
  ): Promise<(Recipe & { authorId: string }) | null>;
}

// Category definitions
const CATEGORIES = [
  { id: "breakfast", label: "Café da Manhã", icon: "🌅" },
  { id: "lunch", label: "Almoço", icon: "🍽️" },
  { id: "dinner", label: "Jantar", icon: "🌙" },
  { id: "dessert", label: "Sobremesa", icon: "🍰" },
  { id: "snack", label: "Lanche", icon: "🥪" },
  { id: "beverage", label: "Bebida", icon: "🥤" },
];

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

export default function SharedRecipe() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { addRecipe } = useRecipes();

  const [recipe, setRecipe] = useState<(Recipe & { authorId: string }) | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadSharedRecipe = async () => {
      if (!shareId) return;

      try {
        setLoading(true);
        const repository = getRepository() as unknown as SharedRecipeRepository;
        const sharedRecipe = await repository.getSharedRecipe(shareId);

        if (!sharedRecipe) {
          toast.error("Receita não encontrada");
          navigate("/");
          return;
        }

        setRecipe(sharedRecipe);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar receita";
        toast.error(message);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadSharedRecipe();
  }, [shareId, navigate]);

  const handleImportRecipe = async () => {
    if (!recipe) return;

    setImporting(true);
    try {
      const newRecipe = await addRecipe({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        categories: recipe.categories,
        prepTime: recipe.prepTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        isFavorite: false,
      });

      toast.success("Receita adicionada à sua biblioteca!");
      navigate(`/receita/${newRecipe.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao importar receita";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const handleCopyLink = async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copiado!");
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Receita não encontrada</p>
      </div>
    );
  }

  const categoryLabels = recipe.categories
    .map((catId) => CATEGORIES.find((c) => c.id === catId))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Link
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleImportRecipe}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Adicionar à Minha Biblioteca"
                )}
              </Button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary">
            <div className="flex h-48 items-center justify-center">
              <ChefHat className="h-24 w-24 text-primary/30" />
            </div>

            {/* Categories */}
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

          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {recipe.title}
            </h1>
            {recipe.description && (
              <p className="text-lg text-muted-foreground">
                {recipe.description}
              </p>
            )}
          </div>

          {/* Meta Info */}
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

          {/* Ingredients */}
          <div className="rounded-2xl bg-card p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Ingredientes
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="flex items-center gap-2 text-foreground"
                >
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>
                    {ing.quantity && <strong>{ing.quantity}</strong>}{" "}
                    {ing.unit && <span>{ing.unit}</span>} {ing.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl bg-card p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Modo de Preparo
            </h2>
            <div className="whitespace-pre-line leading-relaxed text-foreground">
              {recipe.instructions}
            </div>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleImportRecipe}
            disabled={importing}
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              "Adicionar esta Receita à Minha Biblioteca"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
