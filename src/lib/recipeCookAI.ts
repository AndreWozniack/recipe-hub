import { CookMode, CookModeStep, Recipe } from "@/types/recipe";

declare const __COOK_MODE_API_ENDPOINT__: string;

export async function generateStructuredCookMode(
  recipe: Recipe,
): Promise<CookMode> {
  const response = await fetch(__COOK_MODE_API_ENDPOINT__, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipe: {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prepTime: recipe.prepTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
      },
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    throw new Error(
      payload.message || payload.error || "Erro ao gerar modo de preparo",
    );
  }

  const parsed = (await response.json()) as CookMode;

  return {
    summary: parsed.summary,
    estimatedTotalMinutes: parsed.estimatedTotalMinutes,
    steps: (parsed.steps || []).map((step: CookModeStep, index) => ({
      id: step.id || `step-${index + 1}`,
      title: step.title,
      instruction: step.instruction,
      estimatedMinutes: step.estimatedMinutes,
      ingredients: Array.isArray(step.ingredients) ? step.ingredients : [],
      tips: Array.isArray(step.tips) ? step.tips : [],
    })),
  };
}
