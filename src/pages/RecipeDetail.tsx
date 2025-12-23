import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Users,
  Heart,
  ChefHat,
  ShoppingCart,
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
  Sparkles,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryFilter } from "@/components/recipes/CategoryFilter";
import { ShareRecipeDialog } from "@/components/recipes/ShareRecipeDialog";
import { useRecipes } from "@/contexts/RecipeContext";
import {
  Recipe,
  Category,
  Difficulty,
  Ingredient,
  CATEGORIES,
  DIFFICULTY_LABELS,
} from "@/types/recipe";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportRecipeToPDF } from "@/lib/exportPDF";

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    recipes,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    addToShoppingList,
    shoppingList,
  } = useRecipes();

  const [isEditing, setIsEditing] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const found = recipes.find((r) => r.id === id);
    if (found) {
      setRecipe(found);
      resetFormToRecipe(found);
    }
  }, [id, recipes]);

  const resetFormToRecipe = (r: Recipe) => {
    setTitle(r.title);
    setDescription(r.description || "");
    setCategories(r.categories);
    setIngredients(
      r.ingredients.length > 0
        ? r.ingredients
        : [{ id: crypto.randomUUID(), name: "", quantity: "", unit: "" }],
    );
    setInstructions(r.instructions);
    setPrepTime(r.prepTime?.toString() || "");
    setServings(r.servings?.toString() || "");
    setDifficulty(r.difficulty || "");
    setIsFavorite(r.isFavorite);
  };

  const handleExportPDF = () => {
    exportRecipeToPDF(recipe);
    toast.success("Receita pronta para exportar como PDF!");
  };

  if (!recipe) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Receita não encontrada</p>
      </div>
    );
  }

  const isInShoppingList = shoppingList.some(
    (item) => item.recipeId === recipe.id,
  );
  const categoryLabels = recipe.categories
    .map((catId) => CATEGORIES.find((c) => c.id === catId))
    .filter(Boolean);

  const handleToggleCategory = (category: Category) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", quantity: "", unit: "" },
    ]);
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    if (ingredients.length > 1) {
      setIngredients((prev) => prev.filter((ing) => ing.id !== ingredientId));
    }
  };

  const handleIngredientChange = (
    ingredientId: string,
    field: keyof Ingredient,
    value: string,
  ) => {
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === ingredientId ? { ...ing, [field]: value } : ing,
      ),
    );
  };

  const handleSave = async () => {
    const validIngredients = ingredients.filter((ing) => ing.name.trim());

    if (!title.trim()) {
      toast.error("Por favor, adicione um título para a receita.");
      return;
    }

    if (validIngredients.length === 0) {
      toast.error("Por favor, adicione pelo menos um ingrediente.");
      return;
    }

    if (!instructions.trim()) {
      toast.error("Por favor, adicione o modo de preparo.");
      return;
    }

    await updateRecipe(recipe.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      categories,
      ingredients: validIngredients,
      instructions: instructions.trim(),
      prepTime: prepTime ? parseInt(prepTime) : undefined,
      servings: servings ? parseInt(servings) : undefined,
      difficulty: difficulty || undefined,
      isFavorite,
    });

    toast.success("Receita atualizada com sucesso!");
    setIsEditing(false);
  };

  const handleCancel = () => {
    resetFormToRecipe(recipe);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir "${recipe.title}"?`)) {
      await deleteRecipe(recipe.id);
      toast.success("Receita excluída com sucesso!");
      navigate("/");
    }
  };

  const handleAddToList = () => {
    addToShoppingList(recipe.id, recipe.title);
    toast.success(`${recipe.title} adicionada à lista de compras!`);
  };

  // ========== VIEW MODE ==========
  if (!isEditing) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
                {recipe && <ShareRecipeDialog recipe={recipe} />}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
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

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary">
              <div className="flex h-48 items-center justify-center">
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
              <h1 className="font-display text-3xl font-bold text-foreground">
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

            {/* Add to Shopping List */}
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

            {/* Ingredients */}
            <div className="rounded-2xl bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
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
            <div className="rounded-2xl bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
                Modo de Preparo
              </h2>
              <div className="whitespace-pre-line text-foreground leading-relaxed">
                {recipe.instructions}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ========== EDIT MODE ==========
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCancel}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display text-3xl font-bold text-foreground">
                Editar Receita
              </h1>
              <p className="text-muted-foreground">
                Atualize os detalhes da receita
              </p>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Risoto de Cogumelos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Uma breve descrição da receita..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
            <Label>Categorias</Label>
            <CategoryFilter
              selectedCategories={categories}
              onToggleCategory={handleToggleCategory}
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <Label>Ingredientes *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddIngredient}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <motion.div
                  key={ingredient.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Ingrediente"
                    value={ingredient.name}
                    onChange={(e) =>
                      handleIngredientChange(
                        ingredient.id,
                        "name",
                        e.target.value,
                      )
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Qtd"
                    value={ingredient.quantity}
                    onChange={(e) =>
                      handleIngredientChange(
                        ingredient.id,
                        "quantity",
                        e.target.value,
                      )
                    }
                    className="w-20"
                  />
                  <Input
                    placeholder="Unidade"
                    value={ingredient.unit}
                    onChange={(e) =>
                      handleIngredientChange(
                        ingredient.id,
                        "unit",
                        e.target.value,
                      )
                    }
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIngredient(ingredient.id)}
                    disabled={ingredients.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
            <Label htmlFor="instructions">Modo de Preparo *</Label>
            <Textarea
              id="instructions"
              placeholder="Descreva o passo a passo da receita..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
            />
          </div>

          {/* Additional Info */}
          <div className="grid gap-4 rounded-2xl bg-card p-6 shadow-card sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="prepTime">Tempo de Preparo (min)</Label>
              <Input
                id="prepTime"
                type="number"
                placeholder="45"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings">Porções</Label>
              <Input
                id="servings"
                type="number"
                placeholder="4"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificuldade</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as Difficulty)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center justify-between rounded-2xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Receita Favorita</p>
                <p className="text-sm text-muted-foreground">
                  Marque para destacar esta receita
                </p>
              </div>
            </div>
            <Switch checked={isFavorite} onCheckedChange={setIsFavorite} />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
