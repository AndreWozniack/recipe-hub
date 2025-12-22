import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ChefHat, Heart } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CategoryFilter } from "@/components/recipes/CategoryFilter";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { ImportSharedRecipeDialog } from "@/components/recipes/ImportSharedRecipeDialog";
import { Input } from "@/components/ui/input";
import { useRecipes } from "@/contexts/RecipeContext";
import { Category } from "@/types/recipe";

const Index = () => {
  const { recipes } = useRecipes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategories.length === 0 ||
        recipe.categories.some((cat) => selectedCategories.includes(cat));

      // Favorites filter
      const matchesFavorites = !showFavorites || recipe.isFavorite;

      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [recipes, searchQuery, selectedCategories, showFavorites]);

  const handleToggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleShowAll = () => {
    setSelectedCategories([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
            <ChefHat className="h-4 w-4" />
            Meu Livro de Receitas
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Suas receitas favoritas
            <br />
            <span className="text-primary">em um só lugar</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Organize suas receitas, gere listas de compras e nunca mais perca
            aquela receita especial.
          </p>
        </motion.section>

        {/* Search and Filters */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar receitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <ImportSharedRecipeDialog />
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                showFavorites
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Heart
                className={`h-4 w-4 ${showFavorites ? "fill-current" : ""}`}
              />
              Favoritas
            </button>
          </div>

          <CategoryFilter
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
            showAll={selectedCategories.length === 0}
            onShowAll={handleShowAll}
          />
        </motion.section>

        {/* Recipes Grid */}
        <section>
          {filteredRecipes.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRecipes.map((recipe, index) => (
                <RecipeCard key={recipe.id} recipe={recipe} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <ChefHat className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                Nenhuma receita encontrada
              </h3>
              <p className="mt-2 text-muted-foreground">
                Tente ajustar os filtros ou adicione uma nova receita.
              </p>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
