export type Category =
  | "entrada"
  | "prato-principal"
  | "sobremesa"
  | "tempero"
  | "acompanhamento"
  | "lanche"
  | "drink"
  | "molho"
  | "salada";

export type Difficulty = "facil" | "medio" | "dificil";

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

export interface Recipe {
  id: string;
  userId?: string; // Owner of the recipe
  title: string;
  description?: string;
  categories: Category[];
  ingredients: Ingredient[];
  instructions: string;
  prepTime?: number;
  servings?: number;
  difficulty?: Difficulty;
  isFavorite: boolean;
  imageUrl?: string;
  createdAt: Date;
}

export interface CategoryInfo {
  id: Category;
  label: string;
  icon: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: "entrada", label: "Entrada", icon: "🥗" },
  { id: "prato-principal", label: "Prato Principal", icon: "🍽️" },
  { id: "sobremesa", label: "Sobremesa", icon: "🍰" },
  { id: "tempero", label: "Tempero", icon: "🧂" },
  { id: "acompanhamento", label: "Acompanhamento", icon: "🥔" },
  { id: "lanche", label: "Lanche", icon: "🥪" },
  { id: "drink", label: "Drink", icon: "🍹" },
  { id: "molho", label: "Molho", icon: "🫙" },
  { id: "salada", label: "Salada", icon: "🥬" },
];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};
