import { Header } from '@/components/layout/Header';
import { RecipeForm } from '@/components/recipes/RecipeForm';

const NewRecipe = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <RecipeForm />
      </main>
    </div>
  );
};

export default NewRecipe;
