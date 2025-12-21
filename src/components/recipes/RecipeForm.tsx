import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryFilter } from './CategoryFilter';
import { useRecipes } from '@/contexts/RecipeContext';
import { Category, Difficulty, Ingredient, DIFFICULTY_LABELS } from '@/types/recipe';
import { toast } from 'sonner';

export function RecipeForm() {
  const navigate = useNavigate();
  const { addRecipe } = useRecipes();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: crypto.randomUUID(), name: '', quantity: '', unit: '' },
  ]);
  const [instructions, setInstructions] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [isFavorite, setIsFavorite] = useState(false);

  const handleToggleCategory = (category: Category) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', quantity: '', unit: '' },
    ]);
  };

  const handleRemoveIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    }
  };

  const handleIngredientChange = (
    id: string,
    field: keyof Ingredient,
    value: string
  ) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validIngredients = ingredients.filter((ing) => ing.name.trim());

    if (!title.trim()) {
      toast.error('Por favor, adicione um título para a receita.');
      return;
    }

    if (validIngredients.length === 0) {
      toast.error('Por favor, adicione pelo menos um ingrediente.');
      return;
    }

    if (!instructions.trim()) {
      toast.error('Por favor, adicione o modo de preparo.');
      return;
    }

    addRecipe({
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

    toast.success('Receita adicionada com sucesso!');
    navigate('/');
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Nova Receita
          </h1>
          <p className="text-muted-foreground">
            Adicione os detalhes da sua receita
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
                  handleIngredientChange(ingredient.id, 'name', e.target.value)
                }
                className="flex-1"
              />
              <Input
                placeholder="Qtd"
                value={ingredient.quantity}
                onChange={(e) =>
                  handleIngredientChange(ingredient.id, 'quantity', e.target.value)
                }
                className="w-20"
              />
              <Input
                placeholder="Unidade"
                value={ingredient.unit}
                onChange={(e) =>
                  handleIngredientChange(ingredient.id, 'unit', e.target.value)
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
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
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
          onClick={() => navigate(-1)}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 gap-2">
          <Plus className="h-4 w-4" />
          Salvar Receita
        </Button>
      </div>
    </motion.form>
  );
}
