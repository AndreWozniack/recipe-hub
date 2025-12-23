import React, { createContext, useContext } from "react";
import { Recipe, Ingredient } from "@/types/recipe";
import { useRepository } from "@/hooks/useRepository";
import { ShoppingListItem } from "@/data/repositories";

interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: Error | null;
  addRecipe: (recipe: Omit<Recipe, "id" | "createdAt">) => Promise<Recipe>;
  updateRecipe: (
    id: string,
    recipe: Partial<Recipe>,
  ) => Promise<Recipe | null | undefined>;
  deleteRecipe: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<Recipe | null | undefined>;
  shoppingList: ShoppingListItem[];
  addToShoppingList: (recipeId: string, recipeName: string) => Promise<void>;
  removeFromShoppingList: (recipeId: string) => Promise<void>;
  clearShoppingList: () => Promise<void>;
  getShoppingListIngredients: () => Ingredient[];
  refresh: () => Promise<void>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const repository = useRepository();

  return (
    <RecipeContext.Provider value={repository}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error("useRecipes must be used within a RecipeProvider");
  }
  return context;
}
