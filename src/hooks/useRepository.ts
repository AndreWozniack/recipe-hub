import { useState, useEffect, useCallback } from "react";
import { Recipe, Ingredient, RecipeFolder } from "@/types/recipe";
import { getRepository, ShoppingListItem } from "@/data/repositories";
import {
  buildShoppingListIngredients,
  normalizeRecipe,
} from "@/lib/recipeData";
import { generateStructuredCookMode } from "@/lib/recipeCookAI";

interface UseRepositoryOptions {
  enabled?: boolean;
}

const COOK_MODE_RELEVANT_FIELDS: Array<keyof Recipe> = [
  "title",
  "description",
  "categories",
  "ingredients",
  "instructions",
  "prepTime",
  "servings",
  "difficulty",
];

function shouldRefreshCookMode(updates: Partial<Recipe>) {
  return COOK_MODE_RELEVANT_FIELDS.some((field) => field in updates);
}

/**
 * Custom hook that provides access to the repository layer.
 * This hook abstracts the data layer and provides reactive state management.
 *
 * The underlying repository can be switched between localStorage, Supabase, or AWS
 * without changing any component code.
 */
export function useRepository({ enabled = true }: UseRepositoryOptions = {}) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [folders, setFolders] = useState<RecipeFolder[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const repository = getRepository();

  // Load initial data
  const loadData = useCallback(async () => {
    if (!enabled) {
      setRecipes([]);
      setFolders([]);
      setShoppingList([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [recipesData, foldersData, shoppingListData] = await Promise.all([
        repository.getAll(),
        repository.getFolders(),
        repository.getShoppingList(),
      ]);
      setRecipes(recipesData.map(normalizeRecipe));
      setFolders(foldersData);
      setShoppingList(shoppingListData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, [enabled, repository]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persistCookMode = useCallback(
    async (recipe: Recipe) => {
      if (!enabled || recipe.cookMode?.steps.length || !recipe.instructions.trim()) {
        return;
      }

      try {
        const cookMode = await generateStructuredCookMode(recipe);
        const updatedRecipe = await repository.update(recipe.id, { cookMode });

        if (updatedRecipe) {
          setRecipes((prev) =>
            prev.map((item) =>
              item.id === recipe.id ? normalizeRecipe(updatedRecipe) : item,
            ),
          );
        }
      } catch (err) {
        console.error("Erro ao gerar cook mode persistido:", err);
      }
    },
    [enabled, repository],
  );

  // Recipe operations
  const addRecipe = useCallback(
    async (recipe: Omit<Recipe, "id" | "createdAt">) => {
      if (!enabled) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const newRecipe = await repository.create(recipe);
        const normalizedRecipe = normalizeRecipe(newRecipe);
        setRecipes((prev) => [normalizedRecipe, ...prev]);
        setError(null);
        void persistCookMode(normalizedRecipe);
        return newRecipe;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao adicionar receita";
        setError(err instanceof Error ? err : new Error(message));
        console.error("Erro ao adicionar receita:", err);
        throw err;
      }
    },
    [enabled, persistCookMode, repository],
  );

  const updateRecipe = useCallback(
    async (id: string, updates: Partial<Recipe>) => {
      if (!enabled) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const refreshCookMode = shouldRefreshCookMode(updates);
        const updatedRecipe = await repository.update(
          id,
          refreshCookMode ? { ...updates, cookMode: null } : updates,
        );
        if (updatedRecipe) {
          const normalizedRecipe = normalizeRecipe(updatedRecipe);
          setRecipes((prev) =>
            prev.map((recipe) =>
              recipe.id === id ? normalizedRecipe : recipe,
            ),
          );
          if (refreshCookMode) {
            void persistCookMode(normalizedRecipe);
          }
        }
        setError(null);
        return updatedRecipe;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar receita";
        setError(err instanceof Error ? err : new Error(message));
        console.error("Erro ao atualizar receita:", err);
        throw err;
      }
    },
    [enabled, persistCookMode, repository],
  );

  const deleteRecipe = useCallback(
    async (id: string) => {
      if (!enabled) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const success = await repository.delete(id);
        if (success) {
          setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
          setShoppingList((prev) =>
            prev.filter((item) => item.recipeId !== id),
          );
        }
        setError(null);
        return success;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao deletar receita";
        setError(err instanceof Error ? err : new Error(message));
        console.error("Erro ao deletar receita:", err);
        throw err;
      }
    },
    [enabled, repository],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const recipe = recipes.find((r) => r.id === id);
      if (recipe) {
        return updateRecipe(id, { isFavorite: !recipe.isFavorite });
      }
    },
    [recipes, updateRecipe],
  );

  const createFolder = useCallback(
    async (name: string) => {
      if (!enabled) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const folder = await repository.createFolder(name);
        setFolders((prev) =>
          [...prev, folder].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
        );
        setError(null);
        return folder;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao criar pasta";
        setError(err instanceof Error ? err : new Error(message));
        throw err;
      }
    },
    [enabled, repository],
  );

  const updateFolder = useCallback(
    async (id: string, updates: Partial<RecipeFolder>) => {
      if (!enabled) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const folder = await repository.updateFolder(id, updates);
        if (folder) {
          setFolders((prev) =>
            prev
              .map((item) => (item.id === id ? folder : item))
              .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
          );
        }
        setError(null);
        return folder;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar pasta";
        setError(err instanceof Error ? err : new Error(message));
        throw err;
      }
    },
    [enabled, repository],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      if (!enabled) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const success = await repository.deleteFolder(id);
        if (success) {
          setFolders((prev) => prev.filter((folder) => folder.id !== id));
          setRecipes((prev) =>
            prev.map((recipe) =>
              recipe.folderId === id ? { ...recipe, folderId: null } : recipe,
            ),
          );
        }
        setError(null);
        return success;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao excluir pasta";
        setError(err instanceof Error ? err : new Error(message));
        throw err;
      }
    },
    [enabled, repository],
  );

  // Shopping list operations
  const addToShoppingList = useCallback(
    async (recipeId: string, recipeName: string) => {
      if (!enabled) {
        throw new Error("Usuário não autenticado");
      }

      try {
        if (!shoppingList.find((item) => item.recipeId === recipeId)) {
          await repository.addToShoppingList(recipeId, recipeName);
          setShoppingList((prev) => [...prev, { recipeId, recipeName }]);
        }
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erro ao adicionar à lista de compras";
        setError(err instanceof Error ? err : new Error(message));
        console.error("Erro ao adicionar à lista de compras:", err);
        throw err;
      }
    },
    [enabled, repository, shoppingList],
  );

  const removeFromShoppingList = useCallback(
    async (recipeId: string) => {
      if (!enabled) {
        throw new Error("Usuário não autenticado");
      }

      try {
        await repository.removeFromShoppingList(recipeId);
        setShoppingList((prev) =>
          prev.filter((item) => item.recipeId !== recipeId),
        );
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erro ao remover da lista de compras";
        setError(err instanceof Error ? err : new Error(message));
        console.error("Erro ao remover da lista de compras:", err);
        throw err;
      }
    },
    [enabled, repository],
  );

  const clearShoppingList = useCallback(async () => {
    if (!enabled) {
      throw new Error("Usuário não autenticado");
    }

    try {
      await repository.clearShoppingList();
      setShoppingList([]);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao limpar lista de compras";
      setError(err instanceof Error ? err : new Error(message));
      console.error("Erro ao limpar lista de compras:", err);
      throw err;
    }
  }, [enabled, repository]);

  const getShoppingListIngredients = useCallback((): Ingredient[] => {
    return buildShoppingListIngredients(recipes, shoppingList);
  }, [recipes, shoppingList]);

  return {
    // State
    recipes,
    folders,
    shoppingList,
    loading,
    error,

    // Recipe operations
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    createFolder,
    updateFolder,
    deleteFolder,

    // Shopping list operations
    addToShoppingList,
    removeFromShoppingList,
    clearShoppingList,
    getShoppingListIngredients,

    // Utility
    refresh: loadData,
  };
}
