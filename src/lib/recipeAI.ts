import { Category, Difficulty, Ingredient } from "@/types/recipe";

// Variável global definida pelo Vite em tempo de build
declare const __API_ENDPOINT__: string;

const REQUEST_TIMEOUT_MS = 45000;

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
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    const response = await fetch(__API_ENDPOINT__, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        recipeText: recipeText.trim(),
      }),
    });

    window.clearTimeout(timeoutId);

    if (!response.ok) {
      const errorMessage = await extractErrorMessage(response);
      throw new Error(errorMessage);
    }

    const parsedRecipe = (await response.json()) as AIRecipeResponse;

    // Normalizar resposta
    return normalizeAIResponse(parsedRecipe);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error(
          "A IA demorou demais para responder. Tente novamente com um texto menor.",
        );
      }

      if (error.message.includes("Failed to fetch")) {
        throw new Error(
          "Não foi possível conectar ao serviço de importação. Verifique se a API está no ar e tente novamente.",
        );
      }

      throw error;
    }
    throw new Error("Erro desconhecido ao processar receita");
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return (
      data.error ||
      data.message ||
      `Erro ao processar receita (${response.status})`
    );
  } catch {
    return `Erro ao processar receita (${response.status})`;
  }
}

export function normalizeAIResponse(
  response: AIRecipeResponse,
): AIRecipeResponse {
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
