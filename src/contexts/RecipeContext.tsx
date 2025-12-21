import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe, Ingredient } from '@/types/recipe';

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
  shoppingList: { recipeId: string; recipeName: string }[];
  addToShoppingList: (recipeId: string, recipeName: string) => void;
  removeFromShoppingList: (recipeId: string) => void;
  clearShoppingList: () => void;
  getShoppingListIngredients: () => Ingredient[];
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const STORAGE_KEY = 'recipe-repository';
const SHOPPING_LIST_KEY = 'shopping-list';

// Sample recipes for demo
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

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
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
  });

  const [shoppingList, setShoppingList] = useState<{ recipeId: string; recipeName: string }[]>(() => {
    const stored = localStorage.getItem(SHOPPING_LIST_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(shoppingList));
  }, [shoppingList]);

  const addRecipe = (recipe: Omit<Recipe, 'id' | 'createdAt'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setRecipes((prev) => [newRecipe, ...prev]);
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes((prev) =>
      prev.map((recipe) => (recipe.id === id ? { ...recipe, ...updates } : recipe))
    );
  };

  const deleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
    setShoppingList((prev) => prev.filter((item) => item.recipeId !== id));
  };

  const toggleFavorite = (id: string) => {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === id ? { ...recipe, isFavorite: !recipe.isFavorite } : recipe
      )
    );
  };

  const addToShoppingList = (recipeId: string, recipeName: string) => {
    if (!shoppingList.find((item) => item.recipeId === recipeId)) {
      setShoppingList((prev) => [...prev, { recipeId, recipeName }]);
    }
  };

  const removeFromShoppingList = (recipeId: string) => {
    setShoppingList((prev) => prev.filter((item) => item.recipeId !== recipeId));
  };

  const clearShoppingList = () => {
    setShoppingList([]);
  };

  const getShoppingListIngredients = (): Ingredient[] => {
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
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleFavorite,
        shoppingList,
        addToShoppingList,
        removeFromShoppingList,
        clearShoppingList,
        getShoppingListIngredients,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
}
