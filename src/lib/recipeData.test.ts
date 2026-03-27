import { describe, expect, it } from "vitest";
import {
  buildShoppingListIngredients,
  normalizeRecipe,
} from "@/lib/recipeData";
import { Recipe } from "@/types/recipe";

const baseRecipe = {
  id: "1",
  title: "Receita teste",
  categories: [],
  ingredients: [],
  instructions: "",
  isFavorite: false,
  createdAt: new Date(),
} as Recipe;

describe("normalizeRecipe", () => {
  it("preenche campos obrigatorios ausentes", () => {
    const result = normalizeRecipe({
      ...baseRecipe,
      title: "",
      description: undefined as unknown as string,
      categories: undefined as unknown as Recipe["categories"],
      ingredients: undefined as unknown as Recipe["ingredients"],
      instructions: undefined as unknown as string,
      isFavorite: undefined as unknown as boolean,
    });

    expect(result.title).toBe("Receita sem nome");
    expect(result.description).toBe("");
    expect(result.categories).toEqual([]);
    expect(result.ingredients).toEqual([]);
    expect(result.instructions).toBe("");
    expect(result.isFavorite).toBe(false);
  });

  it("normaliza cook mode salvo para reutilizacao futura", () => {
    const result = normalizeRecipe({
      ...baseRecipe,
      cookMode: {
        summary: "",
        steps: [
          {
            id: "",
            title: "",
            instruction: "",
            ingredients: undefined as unknown as string[],
            tips: undefined as unknown as string[],
          },
        ],
      },
    });

    expect(result.cookMode).toEqual({
      summary: "",
      estimatedTotalMinutes: undefined,
      steps: [
        {
          id: "step-1",
          title: "Passo 1",
          instruction: "",
          estimatedMinutes: undefined,
          ingredients: [],
          tips: [],
        },
      ],
    });
  });
});

describe("buildShoppingListIngredients", () => {
  it("agrega ingredientes equivalentes e preserva ordenacao", () => {
    const recipes: Recipe[] = [
      {
        ...baseRecipe,
        id: "r1",
        ingredients: [{ id: "i1", name: "Tomate", quantity: "2", unit: "un" }],
      },
      {
        ...baseRecipe,
        id: "r2",
        ingredients: [{ id: "i2", name: "tomate", quantity: "3", unit: "un" }],
      },
    ];

    const result = buildShoppingListIngredients(recipes, [
      { recipeId: "r1", recipeName: "A" },
      { recipeId: "r2", recipeName: "B" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "Tomate",
      quantity: "5",
      unit: "un",
    });
  });
});
