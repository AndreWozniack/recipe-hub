import { Category, Difficulty, Ingredient } from "@/types/recipe";

// Variável global definida pelo Vite em tempo de build
declare const __API_ENDPOINT__: string;

export interface AIRecipeResponse {
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string;
  prepTime?: number;
  servings?: number;
  difficulty?: Difficulty;
  categories: Category[];
}

/**
 * Parse recipe text using Claude AI via AWS Lambda
 * @param recipeText - Raw recipe text (can be unstructured)
 * @returns Structured recipe data
 */
export async function parseRecipeWithAI(
  recipeText: string,
): Promise<AIRecipeResponse> {
  if (!recipeText || recipeText.trim().length < 50) {
    throw new Error("Texto da receita deve ter pelo menos 50 caracteres");
  }

  try {
    const response = await fetch(__API_ENDPOINT__, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipeText: recipeText.trim(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao processar receita");
    }

    const parsedRecipe = (await response.json()) as AIRecipeResponse;

    // Normalizar resposta
    return normalizeAIResponse(parsedRecipe);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao processar receita");
  }
}

function normalizeAIResponse(response: AIRecipeResponse): AIRecipeResponse {
  // Garantir que ingredients tem IDs
  const ingredients: Ingredient[] = (response.ingredients || []).map(
    (ing: Ingredient) => ({
      id: ing.id || crypto.randomUUID(),
      name: ing.name || "",
      quantity: ing.quantity || "",
      unit: ing.unit || "",
    }),
  );

  // Mapear dificuldade para português
  let difficulty: Difficulty | undefined;
  const diffValue = response.difficulty?.toLowerCase();
  if (diffValue === "facil" || diffValue === "easy") difficulty = "facil";
  else if (diffValue === "medio" || diffValue === "medium")
    difficulty = "medio";
  else if (diffValue === "dificil" || diffValue === "hard")
    difficulty = "dificil";

  // Mapear categorias
  const categoryMap: Record<string, Category> = {
    entrada: "entrada",
    "prato-principal": "prato-principal",
    "prato principal": "prato-principal",
    sobremesa: "sobremesa",
    tempero: "tempero",
    acompanhamento: "acompanhamento",
    lanche: "lanche",
    drink: "drink",
    molho: "molho",
    salada: "salada",
    breakfast: "entrada",
    lunch: "prato-principal",
    dinner: "prato-principal",
    dessert: "sobremesa",
    snack: "lanche",
    beverage: "drink",
    sauce: "molho",
  };

  const categories: Category[] = (response.categories || [])
    .map((cat: string) => categoryMap[cat.toLowerCase()])
    .filter((cat: Category | undefined): cat is Category => !!cat);

  return {
    title: response.title || "Receita sem título",
    description: response.description,
    ingredients,
    instructions: response.instructions || "",
    prepTime: response.prepTime,
    servings: response.servings,
    difficulty,
    categories,
  };
}
