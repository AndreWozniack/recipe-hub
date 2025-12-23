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
  update,
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
  private authPromise: Promise<void>;

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

    // Create a promise that resolves when auth state is determined
    this.authPromise = new Promise((resolve) => {
      this.auth.onAuthStateChanged((user) => {
        this.userId = user?.uid || null;
        resolve();
      });
    });
  }

  private async ensureAuthenticated(): Promise<void> {
    await this.authPromise;
    if (!this.userId) {
      throw new Error("User must be authenticated to use Firebase Repository");
    }
  }

  private getUserRecipesRef() {
    if (!this.userId) {
      throw new Error("User must be authenticated");
    }
    return ref(this.db, `users/${this.userId}/recipes`);
  }

  private getUserShoppingListRef() {
    if (!this.userId) {
      throw new Error("User must be authenticated");
    }
    return ref(this.db, `users/${this.userId}/shoppingList`);
  }

  // Recipe methods
  async getAll(): Promise<Recipe[]> {
    await this.ensureAuthenticated();

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
    await this.ensureAuthenticated();

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
    await this.ensureAuthenticated();

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
    await this.ensureAuthenticated();

    try {
      // Get the existing recipe first
      const existingRecipe = await this.getById(id);
      if (!existingRecipe) {
        return null;
      }

      // Remove id and createdAt from updates if present
      const { id: _, createdAt: __, ...safeUpdates } = updates;
      const cleanedUpdates = cleanObject(safeUpdates);

      // Merge with existing data to preserve all fields
      const mergedData = {
        ...existingRecipe,
        ...cleanedUpdates,
        createdAt: existingRecipe.createdAt.toISOString(),
      };
      
      const recipeRef = child(this.getUserRecipesRef(), id);
      await set(recipeRef, mergedData);

      return this.getById(id);
    } catch (error) {
      const errorMessage = this.formatError(error, "atualizar receita");
      console.error("Erro ao atualizar receita:", error);
      throw new Error(errorMessage);
    }
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureAuthenticated();

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
    await this.ensureAuthenticated();

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
    await this.ensureAuthenticated();

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
        "adicionar à lista de compras",
      );
      console.error("Erro ao adicionar à lista de compras:", error);
      throw new Error(errorMessage);
    }
  }

  async removeFromShoppingList(recipeId: string): Promise<void> {
    await this.ensureAuthenticated();

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
        "remover da lista de compras",
      );
      console.error("Erro ao remover da lista de compras:", error);
      throw new Error(errorMessage);
    }
  }

  async clearShoppingList(): Promise<void> {
    await this.ensureAuthenticated();

    try {
      const shoppingListRef = this.getUserShoppingListRef();
      await remove(shoppingListRef);
    } catch (error) {
      const errorMessage = this.formatError(error, "limpar lista de compras");
      console.error("Erro ao limpar lista de compras:", error);
      throw new Error(errorMessage);
    }
  }

  // Shared Recipes methods
  async shareRecipe(recipeId: string): Promise<string> {
    await this.ensureAuthenticated();

    try {
      const recipe = await this.getById(recipeId);
      if (!recipe) {
        throw new Error("Receita não encontrada");
      }

      const shareId = this.generateShareId();
      const sharedRecipesRef = ref(this.db, `sharedRecipes/${shareId}`);

      const cleanedRecipe = cleanObject({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        categories: recipe.categories,
        prepTime: recipe.prepTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
      });

      await set(sharedRecipesRef, {
        recipeId,
        authorId: this.userId,
        recipe: cleanedRecipe,
        createdAt: new Date().toISOString(),
        sharedAt: new Date().toISOString(),
      });

      return shareId;
    } catch (error) {
      const errorMessage = this.formatError(error, "compartilhar receita");
      console.error("Erro ao compartilhar receita:", error);
      throw new Error(errorMessage);
    }
  }

  async getSharedRecipe(
    shareId: string,
  ): Promise<(Recipe & { authorId: string }) | null> {
    try {
      const sharedRecipeRef = ref(this.db, `sharedRecipes/${shareId}`);
      const snapshot = await get(sharedRecipeRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.val();
      return {
        ...data.recipe,
        id: shareId,
        userId: data.authorId,
        createdAt: new Date(data.createdAt),
      } as Recipe & { authorId: string };
    } catch (error) {
      const errorMessage = this.formatError(
        error,
        "obter receita compartilhada",
      );
      console.error("Erro ao obter receita compartilhada:", error);
      throw new Error(errorMessage);
    }
  }

  async importSharedRecipe(shareId: string): Promise<Recipe> {
    await this.ensureAuthenticated();

    try {
      const sharedRecipe = await this.getSharedRecipe(shareId);
      if (!sharedRecipe) {
        throw new Error("Receita compartilhada não encontrada");
      }

      // Remove user-specific properties
      const { userId, ...recipeData } = sharedRecipe;

      // Create new recipe for current user
      return this.create({
        ...recipeData,
        isFavorite: false,
      });
    } catch (error) {
      const errorMessage = this.formatError(
        error,
        "importar receita compartilhada",
      );
      console.error("Erro ao importar receita compartilhada:", error);
      throw new Error(errorMessage);
    }
  }

  private generateShareId(): string {
    return (
      Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
    );
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
