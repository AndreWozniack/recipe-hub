import { Header } from "@/components/layout/Header";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { useRecipes } from "@/contexts/RecipeContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const NewRecipe = () => {
  const navigate = useNavigate();
  const { addRecipe } = useRecipes();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <RecipeForm
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
