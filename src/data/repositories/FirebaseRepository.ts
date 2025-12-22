import { Recipe } from "@/types/recipe";
import { IRecipeRepository, ShoppingListItem } from "./types";
import {
  getDatabase,
  ref,
  get,
  set,
  remove,
  child,
  Database,
} from "firebase/database";
import { getAuth, Auth } from "firebase/auth";
import { initializeApp, FirebaseApp } from "firebase/app";

// Helper function to remove undefined values from objects
function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {} as Partial<T>);
}

export class FirebaseRepository implements IRecipeRepository {
  private db: Database;
  private auth: Auth;
  private app: FirebaseApp;
  private userId: string | null = null;

  constructor(firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
    databaseURL?: string;
  }) {
    this.app = initializeApp(firebaseConfig);
    this.db = getDatabase(this.app);
    this.auth = getAuth(this.app);

    // Set up auth state listener to get userId
    this.auth.onAuthStateChanged((user) => {
      this.userId = user?.uid || null;
    });
  }

  private ensureAuthenticated(): void {
    if (!this.userId) {
      throw new Error("User must be authenticated to use Firebase Repository");
    }
  }

  private getUserRecipesRef() {
    this.ensureAuthenticated();
    return ref(this.db, `users/${this.userId}/recipes`);
  }

  private getUserShoppingListRef() {
    this.ensureAuthenticated();
    return ref(this.db, `users/${this.userId}/shoppingList`);
  }

  // Recipe methods
  async getAll(): Promise<Recipe[]> {
    this.ensureAuthenticated();

    try {
      const recipesRef = this.getUserRecipesRef();
      const snapshot = await get(recipesRef);

      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val() as Record<string, Omit<Recipe, "id">>;
      return Object.entries(data).map(([id, recipe]) => ({
        ...recipe,
        id,
        createdAt: new Date(recipe.createdAt),
      })) as Recipe[];
    } catch (error) {
      const errorMessage = this.formatError(error, "carregar receitas");
      console.error("Erro ao carregar receitas:", error);
      throw new Error(errorMessage);
    }
  }

  async getById(id: string): Promise<Recipe | null> {
    this.ensureAuthenticated();

    try {
      const recipeRef = child(this.getUserRecipesRef(), id);
      const snapshot = await get(recipeRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.val();
      return {
        ...data,
        id,
        createdAt: new Date(data.createdAt),
      } as Recipe;
    } catch (error) {
      const errorMessage = this.formatError(error, "carregar receita");
      console.error("Erro ao carregar receita:", error);
      throw new Error(errorMessage);
    }
  }

  async create(recipe: Omit<Recipe, "id" | "createdAt">): Promise<Recipe> {
    this.ensureAuthenticated();

    try {
      const recipesRef = this.getUserRecipesRef();
      const cleanedRecipe = cleanObject({
        ...recipe,
        createdAt: new Date().toISOString(),
      });

      // Generate a new key
      const newRecipeRef = child(recipesRef, Date.now().toString());
      await set(newRecipeRef, cleanedRecipe);

      return {
        ...recipe,
        id: Date.now().toString(),
        createdAt: new Date(),
      } as Recipe;
    } catch (error) {
      const errorMessage = this.formatError(error, "criar receita");
      console.error("Erro ao criar receita:", error);
      throw new Error(errorMessage);
    }
  }

  async update(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
    this.ensureAuthenticated();

    try {
      // Remove id and createdAt from updates if present
      const { id: _, createdAt: __, ...safeUpdates } = updates;
      const cleanedUpdates = cleanObject(safeUpdates);

      const recipeRef = child(this.getUserRecipesRef(), id);
      await set(recipeRef, cleanedUpdates);

      return this.getById(id);
    } catch (error) {
      const errorMessage = this.formatError(error, "atualizar receita");
      console.error("Erro ao atualizar receita:", error);
      throw new Error(errorMessage);
    }
  }

  async delete(id: string): Promise<boolean> {
    this.ensureAuthenticated();

    try {
      const recipeRef = child(this.getUserRecipesRef(), id);
      await remove(recipeRef);

      // Also remove from shopping list
      await this.removeFromShoppingList(id);

      return true;
    } catch (error) {
      const errorMessage = this.formatError(error, "deletar receita");
      console.error("Erro ao deletar receita:", error);
      throw new Error(errorMessage);
    }
  }

  // Shopping list methods
  async getShoppingList(): Promise<ShoppingListItem[]> {
    this.ensureAuthenticated();

    try {
      const shoppingListRef = this.getUserShoppingListRef();
      const snapshot = await get(shoppingListRef);

      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val();
      return Object.values(data) as ShoppingListItem[];
    } catch (error) {
      const errorMessage = this.formatError(error, "carregar lista de compras");
      console.error("Erro ao carregar lista de compras:", error);
      throw new Error(errorMessage);
    }
  }

  async addToShoppingList(recipeId: string, recipeName: string): Promise<void> {
    this.ensureAuthenticated();

    try {
      const shoppingListRef = this.getUserShoppingListRef();
      const snapshot = await get(shoppingListRef);

      // Check if already exists
      let exists = false;
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, ShoppingListItem>;
        exists = Object.values(data).some((item) => item.recipeId === recipeId);
      }

      if (!exists) {
        const newItemRef = child(shoppingListRef, Date.now().toString());
        await set(newItemRef, { recipeId, recipeName });
      }
    } catch (error) {
      const errorMessage = this.formatError(
        error,
        "adicionar à lista de compras"
      );
      console.error("Erro ao adicionar à lista de compras:", error);
      throw new Error(errorMessage);
    }
  }

  async removeFromShoppingList(recipeId: string): Promise<void> {
    this.ensureAuthenticated();

    try {
      const shoppingListRef = this.getUserShoppingListRef();
      const snapshot = await get(shoppingListRef);

      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, ShoppingListItem>;
        Object.entries(data).forEach(([key, item]) => {
          if (item.recipeId === recipeId) {
            remove(child(shoppingListRef, key));
          }
        });
      }
    } catch (error) {
      const errorMessage = this.formatError(
        error,
        "remover da lista de compras"
      );
      console.error("Erro ao remover da lista de compras:", error);
      throw new Error(errorMessage);
    }
  }

  async clearShoppingList(): Promise<void> {
    this.ensureAuthenticated();

    try {
      const shoppingListRef = this.getUserShoppingListRef();
      await remove(shoppingListRef);
    } catch (error) {
      const errorMessage = this.formatError(error, "limpar lista de compras");
      console.error("Erro ao limpar lista de compras:", error);
      throw new Error(errorMessage);
    }
  }

  // Error handling helper
  private formatError(error: unknown, context: string): string {
    if (error instanceof Error) {
      // Handle specific Firebase errors
      if (error.message.includes("PERMISSION_DENIED")) {
        return `Sem permissão para ${context}. Faça login novamente.`;
      }
      if (
        error.message.includes("network") ||
        error.message.includes("NETWORK_ERROR")
      ) {
        return "Sem conexão de internet. Verifique sua rede.";
      }
      if (error.message.includes("Unsupported field value")) {
        return `Erro ao ${context}: Campo inválido. Tente novamente.`;
      }
      return `Erro ao ${context}: ${error.message}`;
    }
    return `Erro desconhecido ao ${context}.`;
  }
}
