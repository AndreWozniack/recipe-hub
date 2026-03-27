import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Sparkles, Save } from "lucide-react";
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
import { CategoryFilter } from "./CategoryFilter";
import { ImportRecipeDialog } from "./ImportRecipeDialog";
import {
  Category,
  Difficulty,
  Ingredient,
  Recipe,
  DIFFICULTY_LABELS,
} from "@/types/recipe";
import { toast } from "sonner";

type RecipeDraft = Omit<Recipe, "id" | "createdAt">;

interface ImportedRecipe {
  title?: string;
  description?: string;
  categories?: Category[];
  ingredients?: Ingredient[];
  instructions?: string;
  prepTime?: number | string;
  servings?: number | string;
  difficulty?: Difficulty;
}

interface RecipeFormProps {
  mode?: "create" | "edit";
  initialRecipe?: Partial<RecipeDraft>;
  onSubmit: (recipe: RecipeDraft) => Promise<void> | void;
  onCancel?: () => void;
  submittingLabel?: string;
}

const emptyIngredient = (): Ingredient => ({
  id: crypto.randomUUID(),
  name: "",
  quantity: "",
  unit: "",
});

export function RecipeForm({
  mode = "create",
  initialRecipe,
  onSubmit,
  onCancel,
  submittingLabel,
}: RecipeFormProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([emptyIngredient()]);
  const [instructions, setInstructions] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(initialRecipe?.title || "");
    setDescription(initialRecipe?.description || "");
    setCategories(initialRecipe?.categories || []);
    setInstructions(initialRecipe?.instructions || "");
    setPrepTime(initialRecipe?.prepTime?.toString() || "");
    setServings(initialRecipe?.servings?.toString() || "");
    setDifficulty(initialRecipe?.difficulty || "");
    setIsFavorite(initialRecipe?.isFavorite || false);
    setIngredients(
      initialRecipe?.ingredients?.length
        ? initialRecipe.ingredients.map((ingredient) => ({
            ...ingredient,
            id: ingredient.id || crypto.randomUUID(),
          }))
        : [emptyIngredient()],
    );
  }, [initialRecipe]);

  const handleToggleCategory = (category: Category) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleRecipeImported = (importedRecipe: ImportedRecipe) => {
    setTitle(importedRecipe.title || "");
    setDescription(importedRecipe.description || "");
    setCategories(importedRecipe.categories || []);
    setInstructions(importedRecipe.instructions || "");
    setPrepTime(importedRecipe.prepTime?.toString() || "");
    setServings(importedRecipe.servings?.toString() || "");
    setDifficulty(importedRecipe.difficulty || "");

    if (importedRecipe.ingredients?.length) {
      setIngredients(
        importedRecipe.ingredients.map((ingredient) => ({
          ...ingredient,
          id: ingredient.id || crypto.randomUUID(),
        })),
      );
    }

    toast.success("Receita importada com sucesso!");
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [...prev, emptyIngredient()]);
  };

  const handleRemoveIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    }
  };

  const handleIngredientChange = (
    id: string,
    field: keyof Ingredient,
    value: string,
  ) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing)),
    );
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validIngredients = ingredients
      .map((ingredient) => ({
        ...ingredient,
        name: ingredient.name.trim(),
        quantity: ingredient.quantity.trim(),
        unit: ingredient.unit.trim(),
      }))
      .filter((ingredient) => ingredient.name);

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

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        categories,
        ingredients: validIngredients,
        instructions: instructions.trim(),
        prepTime: prepTime ? Number.parseInt(prepTime, 10) : undefined,
        servings: servings ? Number.parseInt(servings, 10) : undefined,
        difficulty: difficulty || undefined,
        isFavorite,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = mode === "edit";
  const pageTitle = isEditMode ? "Editar Receita" : "Nova Receita";
  const pageDescription = isEditMode
    ? "Atualize os detalhes da receita"
    : "Adicione os detalhes da sua receita";
  const submitText = submittingLabel
    ? submittingLabel
    : isSubmitting
      ? isEditMode
        ? "Salvando..."
        : "Criando..."
      : isEditMode
        ? "Salvar Alterações"
        : "Salvar Receita";

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl space-y-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground">{pageDescription}</p>
          </div>
        </div>
        {!isEditMode && <ImportRecipeDialog onRecipeImported={handleRecipeImported} />}
      </div>

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

      <div className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
        <Label>Categorias</Label>
        <CategoryFilter
          selectedCategories={categories}
          onToggleCategory={handleToggleCategory}
        />
      </div>

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
              className="grid gap-2 sm:grid-cols-[1fr_90px_120px_48px]"
            >
              <Input
                placeholder="Ingrediente"
                value={ingredient.name}
                onChange={(e) =>
                  handleIngredientChange(ingredient.id, "name", e.target.value)
                }
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
              />
              <Input
                placeholder="Unidade"
                value={ingredient.unit}
                onChange={(e) =>
                  handleIngredientChange(ingredient.id, "unit", e.target.value)
                }
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

      <div className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
        <Label htmlFor="instructions">Modo de Preparo *</Label>
        <Textarea
          id="instructions"
          placeholder="Descreva o passo a passo da receita..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={8}
        />
      </div>

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
            onValueChange={(value) => setDifficulty(value as Difficulty)}
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
          {isEditMode ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {submitText}
        </Button>
      </div>
    </motion.form>
  );
}
