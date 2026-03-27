import { ShoppingListItem } from "@/data/repositories";
import { Ingredient, Recipe } from "@/types/recipe";

const normalizeIngredientText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const toNumericQuantity = (value: string) => {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeRecipe = (recipe: Recipe): Recipe => ({
  ...recipe,
  folderId: recipe.folderId || null,
  title: recipe.title || "Receita sem nome",
  description: recipe.description || "",
  categories: Array.isArray(recipe.categories) ? recipe.categories : [],
  ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
  instructions: recipe.instructions || "",
  isFavorite: Boolean(recipe.isFavorite),
  cookMode:
    recipe.cookMode &&
    Array.isArray(recipe.cookMode.steps) &&
    recipe.cookMode.steps.length > 0
      ? {
          summary: recipe.cookMode.summary || "",
          estimatedTotalMinutes: recipe.cookMode.estimatedTotalMinutes,
          steps: recipe.cookMode.steps.map((step, index) => ({
            id: step.id || `step-${index + 1}`,
            title: step.title || `Passo ${index + 1}`,
            instruction: step.instruction || step.title || "",
            estimatedMinutes: step.estimatedMinutes,
            ingredients: Array.isArray(step.ingredients) ? step.ingredients : [],
            tips: Array.isArray(step.tips) ? step.tips : [],
          })),
        }
      : null,
});

export function buildShoppingListIngredients(
  recipes: Recipe[],
  shoppingList: ShoppingListItem[],
): Ingredient[] {
  const ingredientMap = new Map<string, Ingredient>();

  shoppingList.forEach(({ recipeId }) => {
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) {
      return;
    }

    recipe.ingredients.forEach((ingredient) => {
      const normalizedName = normalizeIngredientText(ingredient.name);
      const normalizedUnit = normalizeIngredientText(ingredient.unit);
      const key = `${normalizedName}-${normalizedUnit}`;

      if (!normalizedName) {
        return;
      }

      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        const existingQty = toNumericQuantity(existing.quantity);
        const newQty = toNumericQuantity(ingredient.quantity);

        ingredientMap.set(key, {
          ...existing,
          quantity:
            existingQty !== null && newQty !== null
              ? String(existingQty + newQty)
              : existing.quantity || ingredient.quantity,
        });
        return;
      }

      ingredientMap.set(key, {
        ...ingredient,
        id: `${key}-${recipe.id}`,
        name: ingredient.name.trim(),
        quantity: ingredient.quantity.trim(),
        unit: ingredient.unit.trim(),
      });
    });
  });

  return Array.from(ingredientMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}
