import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { useRecipes } from "@/contexts/RecipeContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const EditRecipe = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { recipes, loading, updateRecipe } = useRecipes();

  const recipe = useMemo(
    () => recipes.find((item) => item.id === id),
    [id, recipes],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-8">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Receita não encontrada
          </h1>
          <Button onClick={() => navigate("/")}>Voltar para receitas</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <RecipeForm
          mode="edit"
          initialRecipe={recipe}
          onCancel={() => navigate(`/receita/${recipe.id}`)}
          onSubmit={async (updates) => {
            await updateRecipe(recipe.id, updates);
            toast.success("Receita atualizada com sucesso!");
            navigate(`/receita/${recipe.id}`);
          }}
        />
      </main>
    </div>
  );
};

export default EditRecipe;
