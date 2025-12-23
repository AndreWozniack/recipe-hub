import { useState, useEffect, useCallback } from "react";
import { Recipe, Ingredient } from "@/types/recipe";
import { getRepository, ShoppingListItem } from "@/data/repositories";

/**
 * Custom hook that provides access to the repository layer.
 * This hook abstracts the data layer and provides reactive state management.
 *
 * The underlying repository can be switched between localStorage, Supabase, or AWS
 * without changing any component code.
 */
export function useRepository() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const repository = getRepository();

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [recipesData, shoppingListData] = await Promise.all([
        repository.getAll(),
        repository.getShoppingList(),
      ]);
      setRecipes(recipesData);
      setShoppingList(shoppingListData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recipe operations
  const addRecipe = useCallback(
    async (recipe: Omit<Recipe, "id" | "createdAt">) => {
      try {
        const newRecipe = await repository.create(recipe);
        setRecipes((prev) => [newRecipe, ...prev]);
        setError(null);
        return newRecipe;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao adicionar receita";
        setError(err instanceof Error ? err : new Error(message));
        console.error("Erro ao adicionar receita:", err);
        throw err;
      }
    },
    [repository],
  );

  const updateRecipe = useCallback(
    async (id: string, updates: Partial<Recipe>) => {
      try {
        const updatedRecipe = await repository.update(id, updates);
        if (updatedRecipe) {
          setRecipes((prev) =>
            prev.map((recipe) => (recipe.id === id ? updatedRecipe : recipe)),
          );
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
    [repository],
  );

  const deleteRecipe = useCallback(
    async (id: string) => {
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
    [repository],
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

  // Shopping list operations
  const addToShoppingList = useCallback(
    async (recipeId: string, recipeName: string) => {
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
    [repository, shoppingList],
  );

  const removeFromShoppingList = useCallback(
    async (recipeId: string) => {
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
    [repository],
  );

  const clearShoppingList = useCallback(async () => {
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
  }, [repository]);

  const getShoppingListIngredients = useCallback((): Ingredient[] => {
    const ingredientMap = new Map<string, Ingredient>();

    shoppingList.forEach(({ recipeId }) => {
      const recipe = recipes.find((r) => r.id === recipeId);
      if (recipe) {
        recipe.ingredients.forEach((ingredient) => {
          const key = `${ingredient.name.toLowerCase()}-${ingredient.unit.toLowerCase()}`;
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            const existingQty = parseFloat(existing.quantity) || 0;
            const newQty = parseFloat(ingredient.quantity) || 0;
            ingredientMap.set(key, {
              ...existing,
              quantity: String(existingQty + newQty),
            });
          } else {
            ingredientMap.set(key, { ...ingredient, id: crypto.randomUUID() });
          }
        });
      }
    });

    return Array.from(ingredientMap.values());
  }, [recipes, shoppingList]);

  return {
    // State
    recipes,
    shoppingList,
    loading,
    error,

    // Recipe operations
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,

    // Shopping list operations
    addToShoppingList,
    removeFromShoppingList,
    clearShoppingList,
    getShoppingListIngredients,

    // Utility
    refresh: loadData,
  };
}
