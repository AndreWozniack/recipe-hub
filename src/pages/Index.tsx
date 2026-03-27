import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ChefHat,
  Heart,
  FolderPlus,
  FolderOpen,
  Grip,
  Trash2,
  Inbox,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CategoryFilter } from "@/components/recipes/CategoryFilter";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { ImportSharedRecipeDialog } from "@/components/recipes/ImportSharedRecipeDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRecipes } from "@/contexts/RecipeContext";
import { Category } from "@/types/recipe";
import { toast } from "sonner";

type FolderFilter = "all" | "unfiled" | string;

const Index = () => {
  const {
    recipes,
    folders,
    loading,
    error,
    createFolder,
    deleteFolder,
    updateRecipe,
  } = useRecipes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderFilter>("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [dropTarget, setDropTarget] = useState<FolderFilter | null>(null);

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
        (recipe.categories ?? []).some((cat) => selectedCategories.includes(cat));

      // Favorites filter
      const matchesFavorites = !showFavorites || recipe.isFavorite;

      const matchesFolder =
        selectedFolder === "all"
          ? true
          : selectedFolder === "unfiled"
            ? !recipe.folderId
            : recipe.folderId === selectedFolder;

      return (
        matchesSearch && matchesCategory && matchesFavorites && matchesFolder
      );
    });
  }, [recipes, searchQuery, selectedCategories, showFavorites, selectedFolder]);

  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();

    recipes.forEach((recipe) => {
      const key = recipe.folderId || "unfiled";
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return counts;
  }, [recipes]);

  const handleToggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleShowAll = () => {
    setSelectedCategories([]);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Digite um nome para a pasta.");
      return;
    }

    await createFolder(newFolderName.trim());
    toast.success("Pasta criada.");
    setNewFolderName("");
  };

  const handleMoveRecipeToFolder = async (
    recipeId: string,
    targetFolder: FolderFilter,
  ) => {
    const folderId = targetFolder === "all" || targetFolder === "unfiled"
      ? null
      : targetFolder;
    await updateRecipe(recipeId, { folderId });
    toast.success(
      folderId
        ? "Receita movida para a pasta."
        : "Receita movida para Sem pasta.",
    );
    setDropTarget(null);
  };

  const handleFolderDrop =
    (targetFolder: FolderFilter) => async (event: React.DragEvent) => {
      event.preventDefault();
      const recipeId = event.dataTransfer.getData("text/recipe-id");
      if (!recipeId) {
        return;
      }
      await handleMoveRecipeToFolder(recipeId, targetFolder);
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

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="h-fit rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-card"
          >
            <div className="flex items-center gap-2">
              <Grip className="h-4 w-4 text-primary" />
              <h2 className="font-display text-2xl text-foreground">
                Pastas
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Arraste receitas para organizar seu livro digital visualmente.
            </p>

            <div className="mt-5 space-y-2">
              {[
                {
                  id: "all",
                  label: "Todas as receitas",
                  icon: FolderOpen,
                  count: recipes.length,
                },
                {
                  id: "unfiled",
                  label: "Sem pasta",
                  icon: Inbox,
                  count: folderCounts.get("unfiled") || 0,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = selectedFolder === item.id;
                const isDropTarget = dropTarget === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedFolder(item.id)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDropTarget(item.id);
                    }}
                    onDragLeave={() => setDropTarget(null)}
                    onDrop={handleFolderDrop(item.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                      isActive
                        ? "border-primary/30 bg-primary/10"
                        : "border-transparent bg-secondary/50 hover:bg-secondary"
                    } ${isDropTarget ? "ring-2 ring-primary/40" : ""}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                      {item.count}
                    </span>
                  </button>
                );
              })}

              {folders.map((folder) => {
                const isActive = selectedFolder === folder.id;
                const isDropTarget = dropTarget === folder.id;

                return (
                  <div
                    key={folder.id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDropTarget(folder.id);
                    }}
                    onDragLeave={() => setDropTarget(null)}
                    onDrop={handleFolderDrop(folder.id)}
                    className={`rounded-2xl border transition-all ${
                      isActive
                        ? "border-primary/30 bg-primary/10"
                        : "border-transparent bg-secondary/50"
                    } ${isDropTarget ? "ring-2 ring-primary/40" : ""}`}
                  >
                    <div className="flex items-center gap-2 px-4 py-3">
                      <button
                        onClick={() => setSelectedFolder(folder.id)}
                        className="flex flex-1 items-center justify-between text-left"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <FolderOpen className="h-4 w-4" />
                          {folder.name}
                        </span>
                        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                          {folderCounts.get(folder.id) || 0}
                        </span>
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            confirm(
                              `Excluir a pasta "${folder.name}"? As receitas continuarão salvas em "Sem pasta".`,
                            )
                          ) {
                            await deleteFolder(folder.id);
                            if (selectedFolder === folder.id) {
                              setSelectedFolder("all");
                            }
                            toast.success("Pasta removida.");
                          }
                        }}
                        className="rounded-full p-1 text-muted-foreground transition hover:bg-background hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-border/70 bg-background/80 p-4">
              <label className="text-sm font-medium text-foreground">
                Nova pasta
              </label>
              <Input
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="Ex: Receitas da família"
              />
              <Button className="w-full gap-2" onClick={handleCreateFolder}>
                <FolderPlus className="h-4 w-4" />
                Criar pasta
              </Button>
            </div>
          </motion.aside>

          <section>
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

          {loading && (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          )}

          {!loading && error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center"
            >
              <h3 className="font-display text-xl font-semibold text-foreground">
                Falha ao carregar receitas
              </h3>
              <p className="mt-2 text-muted-foreground">{error.message}</p>
            </motion.div>
          )}

          {!loading && !error && filteredRecipes.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRecipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={index}
                  folder={
                    folders.find((folder) => folder.id === recipe.folderId) ||
                    null
                  }
                />
              ))}
            </div>
          ) : null}

          {!loading && !error && filteredRecipes.length === 0 ? (
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
                Tente ajustar os filtros, mudar de pasta ou adicionar uma nova receita.
              </p>
            </motion.div>
          ) : null}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
