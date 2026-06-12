import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeAIResponse, parseRecipeWithAI } from "@/lib/recipeAI";

describe("normalizeAIResponse", () => {
  it("normaliza ingredientes, dificuldade e categorias", () => {
    const result = normalizeAIResponse({
      title: "Bolo",
      description: "fofo",
      ingredients: [{ id: "", name: "Farinha", quantity: "2", unit: "xícaras" }],
      instructions: "Misture tudo",
      difficulty: "easy" as never,
      categories: ["dessert", "snack"] as never,
      prepTime: 30,
      servings: 8,
    });

    expect(result.difficulty).toBe("facil");
    expect(result.categories).toEqual(["sobremesa", "lanche"]);
    expect(result.ingredients[0]?.id).toBeTruthy();
  });
});

describe("parseRecipeWithAI", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna erro amigavel quando a API nao responde", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(
      parseRecipeWithAI(
        "Receita longa o suficiente para disparar a validacao do parser de IA e testar a mensagem de erro.",
      ),
    ).rejects.toThrow(
      "Não foi possível conectar ao serviço de importação. Verifique se a API está no ar e tente novamente.",
    );
  });

  it("normaliza a resposta retornada pela API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          title: "Torta",
          ingredients: [{ name: "Ovo", quantity: "2", unit: "un" }],
          instructions: "Asse",
          difficulty: "medium",
          categories: ["lunch"],
        }),
      }),
    );

    const result = await parseRecipeWithAI(
      "Receita longa o suficiente para disparar a validacao do parser de IA e testar a resposta normalizada.",
    );

    expect(result.difficulty).toBe("medio");
    expect(result.categories).toEqual(["prato-principal"]);
    expect(result.ingredients).toHaveLength(1);
  });

  it("anexa Authorization quando authToken é fornecido", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ title: "Bolo", ingredients: [], steps: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await parseRecipeWithAI("x".repeat(60), "token-123");

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-123");
  });

  it("não envia Authorization quando authToken ausente", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ title: "Bolo", ingredients: [], steps: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await parseRecipeWithAI("x".repeat(60));

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});
