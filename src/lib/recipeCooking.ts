import { Ingredient, Recipe } from "@/types/recipe";

export interface RecipeStep {
  id: string;
  text: string;
  title?: string;
  instruction?: string;
  estimatedMinutes?: number;
  ingredients?: string[];
  tips?: string[];
}

const NUMBER_PATTERN = /(\d+(?:[.,]\d+)?)/;

export function parseInstructionSteps(instructions: string): RecipeStep[] {
  const normalized = instructions
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    return [{ id: "step-1", text: "Sem instruções disponíveis." }];
  }

  const bulletLikeLines = normalized.filter((line) =>
    /^(\d+[.)-]?|[-*•])\s+/.test(line),
  );

  const source =
    bulletLikeLines.length >= 2
      ? bulletLikeLines.map((line) => line.replace(/^(\d+[.)-]?|[-*•])\s+/, ""))
      : normalized.join(" ").split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/);

  return source
    .map((step) => step.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `step-${index + 1}`,
      text,
      title: `Passo ${index + 1}`,
      instruction: text,
      ingredients: [],
      tips: [],
    }));
}

export function scaleIngredientQuantity(
  quantity: string,
  multiplier: number,
): string {
  const trimmed = quantity.trim();

  if (!trimmed) {
    return "";
  }

  const match = trimmed.match(NUMBER_PATTERN);
  if (!match || !match[1]) {
    return trimmed;
  }

  const numericValue = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(numericValue)) {
    return trimmed;
  }

  const scaled = formatScaledNumber(numericValue * multiplier);
  return trimmed.replace(match[1], scaled);
}

function formatScaledNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
}

export function buildCookModeIngredients(
  ingredients: Ingredient[],
  multiplier: number,
): Ingredient[] {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: scaleIngredientQuantity(ingredient.quantity, multiplier),
  }));
}

export function getRecipeServings(recipe: Recipe): number {
  return recipe.servings && recipe.servings > 0 ? recipe.servings : 1;
}
