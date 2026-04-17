import { Header } from "@/components/layout/Header";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { useRecipes } from "@/contexts/RecipeContext";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { AIRecipeResponse } from "@/lib/recipeAI";

const NewRecipe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addRecipe } = useRecipes();
  const importedRecipe = (location.state as { importedRecipe?: AIRecipeResponse } | null)
    ?.importedRecipe;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <RecipeForm
          initialRecipe={importedRecipe}
          onSubmit={async (recipe) => {
            await addRecipe(recipe);
            toast.success("Receita adicionada com sucesso!");
            navigate("/");
          }}
        />
      </main>
    </div>
  );
};

export default NewRecipe;
