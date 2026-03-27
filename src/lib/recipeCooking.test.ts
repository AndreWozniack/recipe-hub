import { describe, expect, it } from "vitest";
import {
  buildCookModeIngredients,
  getRecipeServings,
  parseInstructionSteps,
  scaleIngredientQuantity,
} from "@/lib/recipeCooking";

describe("parseInstructionSteps", () => {
  it("quebra instrucoes numeradas em passos", () => {
    const result = parseInstructionSteps(
      "1. Corte a cebola\n2. Refogue no azeite\n3. Finalize com sal",
    );

    expect(result.map((step) => step.text)).toEqual([
      "Corte a cebola",
      "Refogue no azeite",
      "Finalize com sal",
    ]);
  });

  it("faz fallback para frases quando nao ha numeracao", () => {
    const result = parseInstructionSteps(
      "Corte a cebola. Refogue no azeite. Finalize com sal.",
    );

    expect(result).toHaveLength(3);
  });
});

describe("scaleIngredientQuantity", () => {
  it("recalcula quantidades numericas simples", () => {
    expect(scaleIngredientQuantity("2", 1.5)).toBe("3");
    expect(scaleIngredientQuantity("1,5", 2)).toBe("3");
    expect(scaleIngredientQuantity("2-3", 2)).toBe("4-3");
  });

  it("preserva textos sem numeros", () => {
    expect(scaleIngredientQuantity("a gosto", 2)).toBe("a gosto");
  });
});

describe("buildCookModeIngredients", () => {
  it("aplica multiplicador em todos os ingredientes", () => {
    const result = buildCookModeIngredients(
      [
        { id: "1", name: "Farinha", quantity: "2", unit: "xícaras" },
        { id: "2", name: "Sal", quantity: "a gosto", unit: "" },
      ],
      2,
    );

    expect(result[0]?.quantity).toBe("4");
    expect(result[1]?.quantity).toBe("a gosto");
  });
});

describe("getRecipeServings", () => {
  it("retorna 1 quando a receita nao define porcoes", () => {
    expect(
      getRecipeServings({
        id: "1",
        title: "Teste",
        categories: [],
        ingredients: [],
        instructions: "",
        isFavorite: false,
        createdAt: new Date(),
      }),
    ).toBe(1);
  });
});
