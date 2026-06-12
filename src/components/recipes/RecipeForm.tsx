import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Sparkles, Save, Loader2, GripVertical, AlignLeft, ListOrdered } from "lucide-react";
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
import { convertTextToSteps } from "@/lib/recipeAI";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "sonner";

type RecipeDraft = Omit<Recipe, "id" | "createdAt">;

interface ImportedRecipe {
  title?: string;
  description?: string;
  categories?: Category[];
  ingredients?: Ingredient[];
  steps?: string[];
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

function splitInstructionsToSteps(instructions: string): string[] {
  const lines = instructions.split("\n").map((l) => l.trim()).filter(Boolean);
  const numbered = lines.filter((l) => /^\d+[.)]\s/.test(l));
  if (numbered.length >= 2) {
    return numbered.map((l) => l.replace(/^\d+[.)]\s+/, ""));
  }
  if (lines.length >= 2) return lines;
  // Split by sentence boundary as last resort
  const sentences = instructions.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/);
  return sentences.map((s) => s.trim()).filter(Boolean);
}

export function RecipeForm({
  mode = "create",
  initialRecipe,
  onSubmit,
  onCancel,
  submittingLabel,
}: RecipeFormProps) {
  const navigate = useNavigate();
  const { getIdToken } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([emptyIngredient()]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [textMode, setTextMode] = useState(false);
  const [rawText, setRawText] = useState("");
  const [convertingToSteps, setConvertingToSteps] = useState(false);
  const [prepTime, setPrepTime] = useState("");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(initialRecipe?.title || "");
    setDescription(initialRecipe?.description || "");
    setCategories(initialRecipe?.categories || []);
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

    if (initialRecipe?.steps?.length) {
      setSteps(initialRecipe.steps);
    } else if (initialRecipe?.instructions) {
      setSteps(splitInstructionsToSteps(initialRecipe.instructions));
    } else {
      setSteps([""]);
    }
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
    setPrepTime(importedRecipe.prepTime?.toString() || "");
    setServings(importedRecipe.servings?.toString() || "");
    setDifficulty(importedRecipe.difficulty || "");

    if (importedRecipe.steps?.length) {
      setSteps(importedRecipe.steps);
    } else if (importedRecipe.instructions) {
      setSteps(splitInstructionsToSteps(importedRecipe.instructions));
    }

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

  const handleAddStep = () => {
    setSteps((prev) => [...prev, ""]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      setSteps((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleStepChange = (index: number, value: string) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  const handleSwitchToTextMode = () => {
    const filled = steps.filter((s) => s.trim());
    if (filled.length > 0) {
      setRawText(filled.map((s, i) => `${i + 1}. ${s}`).join("\n"));
    }
    setTextMode(true);
  };

  const handleSwitchToStepsMode = () => {
    if (rawText.trim() && steps.every((s) => !s.trim())) {
      setSteps(splitInstructionsToSteps(rawText));
    }
    setTextMode(false);
  };

  const handleConvertToSteps = async () => {
    if (!rawText.trim()) {
      toast.error("Digite o modo de preparo antes de converter.");
      return;
    }
    setConvertingToSteps(true);
    try {
      const authToken = (await getIdToken()) ?? undefined;
      const converted = await convertTextToSteps(rawText, authToken);
      if (converted.length === 0) {
        toast.error("A IA não conseguiu identificar os passos. Tente novamente.");
        return;
      }
      setSteps(converted);
      setTextMode(false);
      toast.success(`${converted.length} passos identificados!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao converter. Tente novamente.");
    } finally {
      setConvertingToSteps(false);
    }
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

    const validSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (validSteps.length === 0) {
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
        steps: validSteps,
        instructions: validSteps.join("\n"),
        prepTime: prepTime ? Number.parseInt(prepTime, 10) : undefined,
        servings: servings ? Number.parseInt(servings, 10) : undefined,
        difficulty: difficulty || undefined,
        isFavorite,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar receita. Tente novamente.");
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

      {/* Instructions / Steps section */}
      <div className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <Label>Modo de Preparo *</Label>
          <button
            type="button"
            onClick={textMode ? handleSwitchToStepsMode : handleSwitchToTextMode}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {textMode ? (
              <>
                <ListOrdered className="h-3.5 w-3.5" />
                Modo por passos
              </>
            ) : (
              <>
                <AlignLeft className="h-3.5 w-3.5" />
                Escrever como texto
              </>
            )}
          </button>
        </div>

        {textMode ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Descreva o modo de preparo em texto livre..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleConvertToSteps}
              disabled={convertingToSteps || !rawText.trim()}
              className="gap-2"
            >
              {convertingToSteps ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {convertingToSteps ? "Convertendo..." : "Converter em passos com IA"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex gap-2 items-start"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold mt-1">
                  {index + 1}
                </div>
                <Textarea
                  placeholder={`Passo ${index + 1}...`}
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  rows={2}
                  className="flex-1 resize-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveStep(index)}
                  disabled={steps.length === 1}
                  className="mt-1 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddStep}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Adicionar passo
            </Button>
          </div>
        )}
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
