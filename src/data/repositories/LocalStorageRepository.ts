import { Recipe } from '@/types/recipe';
import { IRecipeRepository, ShoppingListItem } from './types';

const STORAGE_KEY = 'recipe-repository';
const SHOPPING_LIST_KEY = 'shopping-list';

// Sample recipes for demo/initial load
const sampleRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Risoto de Cogumelos',
    description: 'Um risoto cremoso com mix de cogumelos frescos e parmesão',
    categories: ['prato-principal'],
    ingredients: [
      { id: '1', name: 'Arroz arbóreo', quantity: '300', unit: 'g' },
      { id: '2', name: 'Cogumelos variados', quantity: '200', unit: 'g' },
      { id: '3', name: 'Caldo de legumes', quantity: '1', unit: 'L' },
      { id: '4', name: 'Parmesão ralado', quantity: '100', unit: 'g' },
      { id: '5', name: 'Manteiga', quantity: '50', unit: 'g' },
      { id: '6', name: 'Cebola', quantity: '1', unit: 'unidade' },
    ],
    instructions: '1. Refogue a cebola na manteiga.\n2. Adicione o arroz e toste por 2 minutos.\n3. Adicione o caldo aos poucos, mexendo sempre.\n4. Quando o arroz estiver al dente, adicione os cogumelos salteados.\n5. Finalize com parmesão e manteiga.',
    prepTime: 45,
    servings: 4,
    difficulty: 'medio',
    isFavorite: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Brigadeiro Gourmet',
    description: 'O clássico brasileiro em versão gourmet com chocolate belga',
    categories: ['sobremesa'],
    ingredients: [
      { id: '1', name: 'Leite condensado', quantity: '395', unit: 'g' },
      { id: '2', name: 'Chocolate em pó', quantity: '4', unit: 'colheres' },
      { id: '3', name: 'Manteiga', quantity: '1', unit: 'colher' },
      { id: '4', name: 'Granulado', quantity: '100', unit: 'g' },
    ],
    instructions: '1. Misture o leite condensado, chocolate e manteiga em uma panela.\n2. Cozinhe em fogo médio, mexendo sempre até desgrudar do fundo.\n3. Deixe esfriar e enrole em bolinhas.\n4. Passe no granulado.',
    prepTime: 30,
    servings: 20,
    difficulty: 'facil',
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Caipirinha de Limão',
    description: 'O drink mais famoso do Brasil',
    categories: ['drink'],
    ingredients: [
      { id: '1', name: 'Limão', quantity: '1', unit: 'unidade' },
      { id: '2', name: 'Cachaça', quantity: '50', unit: 'ml' },
      { id: '3', name: 'Açúcar', quantity: '2', unit: 'colheres' },
      { id: '4', name: 'Gelo', quantity: 'a gosto', unit: '' },
    ],
    instructions: '1. Corte o limão em pedaços e coloque no copo.\n2. Adicione o açúcar e macere bem.\n3. Complete com gelo e cachaça.\n4. Mexa e sirva.',
    prepTime: 5,
    servings: 1,
    difficulty: 'facil',
    isFavorite: true,
    createdAt: new Date(),
  },
];

export class LocalStorageRepository implements IRecipeRepository {
  private getStoredRecipes(): Recipe[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored).map((r: Recipe) => ({
          ...r,
          createdAt: new Date(r.createdAt),
        }));
      } catch {
        return sampleRecipes;
      }
    }
    return sampleRecipes;
  }

  private saveRecipes(recipes: Recipe[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  }

  private getStoredShoppingList(): ShoppingListItem[] {
    const stored = localStorage.getItem(SHOPPING_LIST_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  }

  private saveShoppingList(list: ShoppingListItem[]): void {
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(list));
  }

  // Recipe methods
  async getAll(): Promise<Recipe[]> {
    return this.getStoredRecipes();
  }

  async getById(id: string): Promise<Recipe | null> {
    const recipes = this.getStoredRecipes();
    return recipes.find((r) => r.id === id) || null;
  }

  async create(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
    const recipes = this.getStoredRecipes();
    const newRecipe: Recipe = {
      ...recipe,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.saveRecipes([newRecipe, ...recipes]);
    return newRecipe;
  }

  async update(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
    const recipes = this.getStoredRecipes();
    const index = recipes.findIndex((r) => r.id === id);
    if (index === -1) return null;
    
    const updatedRecipe = { ...recipes[index], ...updates };
    recipes[index] = updatedRecipe;
    this.saveRecipes(recipes);
    return updatedRecipe;
  }

  async delete(id: string): Promise<boolean> {
    const recipes = this.getStoredRecipes();
    const filtered = recipes.filter((r) => r.id !== id);
    if (filtered.length === recipes.length) return false;
    
    this.saveRecipes(filtered);
    
    // Also remove from shopping list
    const shoppingList = this.getStoredShoppingList();
    this.saveShoppingList(shoppingList.filter((item) => item.recipeId !== id));
    
    return true;
  }

  // Shopping list methods
  async getShoppingList(): Promise<ShoppingListItem[]> {
    return this.getStoredShoppingList();
  }

  async addToShoppingList(recipeId: string, recipeName: string): Promise<void> {
    const list = this.getStoredShoppingList();
    if (!list.find((item) => item.recipeId === recipeId)) {
      this.saveShoppingList([...list, { recipeId, recipeName }]);
    }
  }

  async removeFromShoppingList(recipeId: string): Promise<void> {
    const list = this.getStoredShoppingList();
    this.saveShoppingList(list.filter((item) => item.recipeId !== recipeId));
  }

  async clearShoppingList(): Promise<void> {
    this.saveShoppingList([]);
  }
}
