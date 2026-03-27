import { Recipe, Ingredient, RecipeFolder } from "@/types/recipe";

// Base repository interface for CRUD operations
export interface IRecipeRepository {
  // Recipes
  getAll(): Promise<Recipe[]>;
  getById(id: string): Promise<Recipe | null>;
  create(recipe: Omit<Recipe, "id" | "createdAt">): Promise<Recipe>;
  update(id: string, updates: Partial<Recipe>): Promise<Recipe | null>;
  delete(id: string): Promise<boolean>;

  // Folders
  getFolders(): Promise<RecipeFolder[]>;
  createFolder(name: string): Promise<RecipeFolder>;
  updateFolder(id: string, updates: Partial<RecipeFolder>): Promise<RecipeFolder | null>;
  deleteFolder(id: string): Promise<boolean>;

  // Shopping List
  getShoppingList(): Promise<ShoppingListItem[]>;
  addToShoppingList(recipeId: string, recipeName: string): Promise<void>;
  removeFromShoppingList(recipeId: string): Promise<void>;
  clearShoppingList(): Promise<void>;
}

export interface ShoppingListItem {
  recipeId: string;
  recipeName: string;
}

// Database provider types
export type DatabaseProvider = "localStorage" | "supabase" | "aws" | "firebase";

// Configuration for database connection
export interface DatabaseConfig {
  provider: DatabaseProvider;
  // Supabase config
  supabaseUrl?: string;
  supabaseKey?: string;
  // AWS config
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsTableName?: string;
  // Firebase config
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
    databaseURL?: string;
  };
}
