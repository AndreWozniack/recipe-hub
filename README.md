# 🍳 Recipe Hub - Livro de Receitas Digital

Um aplicativo web completo para gerenciar, compartilhar e organizar suas receitas favoritas. Desenvolvido com React, TypeScript, Firebase e Tailwind CSS.

---

## 📋 Índice Rápido

- [Estrutura do Projeto](#estrutura-do-projeto)
- [Autenticação](#autenticação)
- [CRUD de Receitas](#crud-de-receitas)
- [Compartilhamento de Receitas](#compartilhamento-de-receitas)
- [Importação com IA](#-importação-de-receitas-com-ia)
- [Páginas Principais](#páginas-principais)
- [Componentes Reutilizáveis](#componentes-reutilizáveis)
- [Tipos e Contextos](#tipos-e-contextos)

---

## 📁 Estrutura do Projeto

```
recipe-hub/
├── src/
│   ├── auth/                          # 🔐 Autenticação
│   │   ├── authConfig.ts              # Configuração Firebase
│   │   ├── AuthContext.tsx            # Context de autenticação
│   │   ├── types.ts                   # Tipos de autenticação
│   │   └── providers/                 # Provedores de auth
│   │       ├── CustomAuthProvider.ts
│   │       └── FirebaseAuthProvider.ts
│   │
│   ├── data/repositories/             # 🗄️ Camada de Dados (CRUD)
│   │   ├── index.ts                   # Factory e exports
│   │   ├── types.ts                   # Interfaces do repositório
│   │   └── FirebaseRepository.ts      # ⭐ CRUD Principal (Firebase)
│   │       ├── getAll()               # Busca todas as receitas
│   │       ├── getById()              # Busca receita por ID
│   │       ├── create()               # Cria nova receita
│   │       ├── update()               # Atualiza receita
│   │       ├── delete()               # Deleta receita
│   │       ├── shareRecipe()          # Compartilha receita
│   │       ├── getSharedRecipe()      # Busca receita compartilhada
│   │       └── importSharedRecipe()   # Importa receita compartilhada
│   │
│   ├── contexts/                      # 📦 Context API
│   │   └── RecipeContext.tsx          # Context global de receitas
│   │
│   ├── hooks/                         # 🎣 Custom Hooks
│   │   ├── useRepository.ts           # Hook para acessar repositório
│   │   └── use-toast.ts               # Hook para notificações
│   │
│   ├── lib/                           # 🛠️ Utilitários
│   │   ├── recipeSharing.ts           # Funções de compartilhamento
│   │   ├── recipeAI.ts                # Integração Claude AI para parsing
│   │   ├── exportPDF.ts               # Exportação de receitas em PDF
│   │   └── utils.ts                   # Funções auxiliares
│   │
│   ├── types/                         # 📝 Tipos TypeScript
│   │   └── recipe.ts                  # Interface Recipe, categorias, dificuldade
│   │
│   ├── pages/                         # 📄 Páginas Principais
│   │   ├── Index.tsx                  # Home - lista de receitas
│   │   ├── RecipeDetail.tsx           # Detalhe - edição e visualização
│   │   ├── NewRecipe.tsx              # Criar nova receita
│   │   ├── SharedRecipe.tsx           # Visualizar receita compartilhada
│   │   ├── ShoppingListPage.tsx       # Lista de compras
│   │   ├── Auth.tsx                   # Login/Registro
│   │   └── NotFound.tsx               # 404
│   │
│   ├── components/                    # 🧩 Componentes Reutilizáveis
│   │   ├── layout/
│   │   │   └── Header.tsx             # Cabeçalho com navegação
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx     # Route protegido por autenticação
│   │   ├── recipes/
│   │   │   ├── RecipeCard.tsx         # Card de receita
│   │   │   ├── RecipeForm.tsx         # Formulário de receita
│   │   │   ├── CategoryFilter.tsx     # Filtro de categorias
│   │   │   ├── ShareRecipeDialog.tsx  # Dialog para compartilhar
│   │   │   ├── ImportSharedRecipeDialog.tsx # Dialog para importar via link
│   │   │   └── ImportRecipeDialog.tsx # Dialog para importar com IA
│   │   ├── shopping/
│   │   │   └── ShoppingList.tsx       # Componente da lista de compras
│   │   └── ui/                        # Componentes Shadcn/UI
│   │       └── [componentes base...]
│   │
│   ├── App.tsx                        # ⭐ App principal com rotas
│   └── main.tsx                       # Entry point
│
└── package.json
```

---

## 🔐 Autenticação

### Arquivos Principais

| Arquivo                     | Localização            | Descrição                                     |
| --------------------------- | ---------------------- | --------------------------------------------- |
| **authConfig.ts**           | `src/auth/`            | Configuração do Firebase e tipos de provider  |
| **AuthContext.tsx**         | `src/auth/`            | Context global de autenticação                |
| **FirebaseAuthProvider.ts** | `src/auth/providers/`  | Implementação Firebase de autenticação        |
| **ProtectedRoute.tsx**      | `src/components/auth/` | Componente que protege rotas por autenticação |

### Como Funciona

1. **Configuração**: `authConfig.ts` define qual provider usar (Firebase)
2. **Context**: `AuthContext.tsx` disponibiliza `user` e métodos de login/logout
3. **Proteção**: `ProtectedRoute.tsx` redireciona para `/auth` se não autenticado
4. **App.tsx**: Envolve toda a app com `<AuthProvider>`

```tsx
// Como usar em um componente
const { user, logout } = useAuth();
```

---

## 🗄️ CRUD de Receitas

### Arquivos Principais

**Localização**: `src/data/repositories/`

| Arquivo                   | Função                                         |
| ------------------------- | ---------------------------------------------- |
| **FirebaseRepository.ts** | ⭐ Implementação COMPLETA do CRUD              |
| **index.ts**              | Factory pattern e inicialização do repositório |
| **types.ts**              | Interface `IRecipeRepository`                  |

### Métodos CRUD no FirebaseRepository

#### CREATE - Criar Receita

```typescript
async create(recipe: Omit<Recipe, "id" | "createdAt">): Promise<Recipe>
```

- Salva em: `users/{userId}/recipes/{timestamp}`
- Remove valores `undefined` com `cleanObject()`

#### READ - Buscar Receitas

```typescript
async getAll(): Promise<Recipe[]>              // Todas as receitas do usuário
async getById(id: string): Promise<Recipe | null>  // Receita específica
```

- Aguarda autenticação com `ensureAuthenticated()`

#### UPDATE - Atualizar Receita

```typescript
async update(id: string, updates: Partial<Recipe>): Promise<Recipe | null>
```

- Substitui a receita inteira

#### DELETE - Deletar Receita

```typescript
async delete(id: string): Promise<boolean>
```

- Remove a receita
- Remove também da lista de compras

### Estrutura de Dados no Firebase

```
users/
  └── {userId}/
      ├── recipes/
      │   ├── {recipeId}: { title, ingredients, instructions, ... }
      │   └── {recipeId2}: { ... }
      └── shoppingList/
          ├── {itemId}: { recipeId, recipeName }
          └── {itemId2}: { ... }

sharedRecipes/
  └── {shareId}: { recipeId, authorId, recipe: {...}, createdAt, sharedAt }
```

---

## 🔗 Compartilhamento de Receitas

### Arquivos Principais

| Arquivo                          | Localização               | Função                                                                |
| -------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| **FirebaseRepository.ts**        | `src/data/repositories/`  | Métodos: `shareRecipe()`, `getSharedRecipe()`, `importSharedRecipe()` |
| **recipeSharing.ts**             | `src/lib/`                | Funções utilitárias de compartilhamento                               |
| **ShareRecipeDialog.tsx**        | `src/components/recipes/` | Dialog para gerar e compartilhar link                                 |
| **ImportSharedRecipeDialog.tsx** | `src/components/recipes/` | Dialog para colar e importar link                                     |
| **SharedRecipe.tsx**             | `src/pages/`              | Página para visualizar receita compartilhada                          |

### Fluxo de Compartilhamento

#### 1️⃣ **Compartilhar Receita**

```
RecipeDetail.tsx → ShareRecipeDialog.tsx → FirebaseRepository.shareRecipe()
                                          ↓
                                  Gera ID único (shareId)
                                  Salva em sharedRecipes/{shareId}
                                  Gera link: /compartilhar/{shareId}
```

#### 2️⃣ **Importar via Link**

```
Index.tsx → ImportSharedRecipeDialog.tsx → FirebaseRepository.getSharedRecipe()
                                           ↓
                                    Busca a receita compartilhada
                                    Redireciona para /compartilhar/{shareId}
```

#### 3️⃣ **Visualizar Receita Compartilhada**

```
SharedRecipe.tsx → getSharedRecipe() → Exibe receita
                                      ↓
                               Botão "Adicionar à Minha Biblioteca"
                                      ↓
                            importSharedRecipe() → cria cópia para usuário
```

### Métodos de Compartilhamento

```typescript
// Compartilhar
async shareRecipe(recipeId: string): Promise<string>  // Retorna shareId

// Buscar receita compartilhada
async getSharedRecipe(shareId: string): Promise<Recipe & { authorId: string } | null>

// Importar receita compartilhada
async importSharedRecipe(shareId: string): Promise<Recipe>
```

### Funções Utilitárias em `recipeSharing.ts`

```typescript
createShareLink(shareId: string): string                    // Cria URL
copyShareLinkToClipboard(link: string): Promise<void>     // Copia para clipboard
shareViaWhatsApp(title: string, link: string): void       // WhatsApp
shareViaEmail(title: string, link: string): void          // Email
shareViaFacebook(link: string): void                       // Facebook
```

---

## 🤖 Importação de Receitas com IA

### Arquivos Principais

| Arquivo                    | Localização               | Função                                     |
| -------------------------- | ------------------------- | ------------------------------------------ |
| **recipeAI.ts**            | `src/lib/`                | Serviço Claude AI para parsing de receitas |
| **ImportRecipeDialog.tsx** | `src/components/recipes/` | Dialog para colar texto e processar com IA |

### Como Funciona

1. **Usuário Cole Texto**: Cole qualquer receita (blog, PDF, texto livre)
2. **IA Processa**: Claude AI estrutura em JSON
3. **Formulário Preenchido**: Campos auto-preenchem na página Nova Receita
4. **Revisar e Salvar**: Usuário revisa dados e salva receita

### Serviço Claude AI

```typescript
// Importar receitas com IA usando Claude
async function parseRecipeWithAI(recipeText: string): Promise<AIRecipeResponse>;

interface AIRecipeResponse {
  title: string; // Título extraído
  description?: string; // Descrição curta
  ingredients: Ingredient[]; // Array com ingredientes
  instructions: string; // Modo de preparo
  prepTime?: number; // Tempo de preparo em minutos
  servings?: number; // Número de porções
  difficulty?: Difficulty; // "fácil", "médio", "difícil"
  categories: Category[]; // Categorias identificadas
}
```

### Fluxo de Integração

```
NewRecipe.tsx (RecipeForm.tsx)
    ↓
ImportRecipeDialog.tsx (Botão "Importar com IA")
    ↓
parseRecipeWithAI(recipeText)
    ↓
Anthropic Claude API (v1/messages)
    ↓
AIRecipeResponse (JSON estruturado)
    ↓
handleRecipeImported() - Popula todos os campos do formulário
    ↓
Usuário revisa e clica "Salvar"
```

### Variáveis de Ambiente

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

**Obter API Key**: [console.anthropic.com](https://console.anthropic.com/)

**Modelo Usado**: `claude-3-5-sonnet-20241022`

**Custo**: ~$0.001 por receita processada

---

## 📄 Páginas Principais

### Index.tsx (Home)

**Localização**: `src/pages/Index.tsx`

- **Função**: Lista todas as receitas do usuário
- **Recursos**:
  - Busca por título/descrição
  - Filtro por categorias
  - Filtro de favoritas
  - **ImportSharedRecipeDialog** para colar links compartilhados
  - Cards de receita que redirecionam para detalhe

### RecipeDetail.tsx (Detalhe/Edição)

**Localização**: `src/pages/RecipeDetail.tsx`

- **Função**: Visualizar e editar receita individual
- **Recursos**:
  - Modo visualização e modo edição
  - Exportar para PDF
  - **Compartilhar** receita
  - Marcar como favorita
  - Adicionar à lista de compras
  - Editar todos os campos
  - Deletar receita
  - Botão voltar para home

### NewRecipe.tsx (Criar)

**Localização**: `src/pages/NewRecipe.tsx`

- **Função**: Criar nova receita
- **Recursos**:
  - Formulário completo
  - Pode ter importação com IA (planejado)

### SharedRecipe.tsx (Compartilhada)

**Localização**: `src/pages/SharedRecipe.tsx`

- **Função**: Visualizar receita compartilhada
- **Recursos**:
  - Acesso sem autenticação
  - Copiar link compartilhado
  - Botão "Adicionar à Minha Biblioteca"

### ShoppingListPage.tsx (Lista de Compras)

**Localização**: `src/pages/ShoppingListPage.tsx`

- **Função**: Gerenciar lista de compras agregada
- **Recursos**:
  - Lista de ingredientes de todas as receitas adicionadas
  - Marcar como comprado
  - Limpar lista

### Auth.tsx (Login)

**Localização**: `src/pages/Auth.tsx`

- **Função**: Autenticação Firebase
- **Recursos**:
  - Login com email/senha
  - Registro
  - Verificação de email

---

## 🧩 Componentes Reutilizáveis

### Componentes de Receita

| Componente                       | Localização               | Propósito                             |
| -------------------------------- | ------------------------- | ------------------------------------- |
| **RecipeCard.tsx**               | `src/components/recipes/` | Card exibindo resumo da receita       |
| **RecipeForm.tsx**               | `src/components/recipes/` | Formulário completo para criar/editar |
| **CategoryFilter.tsx**           | `src/components/recipes/` | Filtro visual de categorias           |
| **ShareRecipeDialog.tsx**        | `src/components/recipes/` | Dialog para gerar link compartilhado  |
| **ImportSharedRecipeDialog.tsx** | `src/components/recipes/` | Dialog para colar link e importar     |

### Componentes de Layout

| Componente             | Localização              | Propósito                        |
| ---------------------- | ------------------------ | -------------------------------- |
| **Header.tsx**         | `src/components/layout/` | Cabeçalho com navegação e logout |
| **ProtectedRoute.tsx** | `src/components/auth/`   | Wrapper para rotas protegidas    |

---

## 📝 Tipos e Contextos

### Tipos em `src/types/recipe.ts`

```typescript
interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string;
  categories: Category[];
  prepTime?: number; // em minutos
  servings?: number;
  difficulty?: Difficulty;
  isFavorite: boolean;
  createdAt: Date;
  userId?: string;
}

interface Ingredient {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
}

type Category =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "dessert"
  | "snack"
  | "beverage";
type Difficulty = "easy" | "medium" | "hard";

const CATEGORIES = [
  { id: "breakfast", label: "Café da Manhã", icon: "🌅" },
  { id: "lunch", label: "Almoço", icon: "🍽️" },
  // ...
];
```

### RecipeContext em `src/contexts/RecipeContext.tsx`

```typescript
interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: Error | null;
  addRecipe: (recipe: Omit<Recipe, "id" | "createdAt">) => Promise<Recipe>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<Recipe | null>;
  deleteRecipe: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<Recipe | null>;
  shoppingList: ShoppingListItem[];
  addToShoppingList: (recipeId: string, recipeName: string) => Promise<void>;
  // ...
}
```

**Como usar**:

```tsx
const { recipes, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
```

---

## 🔄 Fluxo de Dados

```
App.tsx (Routes + Context)
    ↓
AuthProvider → AuthContext (user, login, logout)
    ↓
RecipeProvider → RecipeContext (recipes, CRUD)
    ↓
useRecipes() → useRepository() → FirebaseRepository (Firebase API)
    ↓
Firebase Realtime Database
```

---

## ⚙️ Inicialização do Repositório

**Arquivo**: `src/App.tsx`

```typescript
initializeRepository({
  provider: "firebase",
  firebaseConfig: authConfig.firebaseConfig!,
});
```

- Apenas Firebase está implementado
- Factory pattern em `src/data/repositories/index.ts`

---

## 📦 Instalação e Setup

### Dependências Principais

- **React 18** + **TypeScript**
- **Firebase** (Auth + Realtime Database)
- **Tailwind CSS** + **Shadcn/UI**
- **React Router** (navegação)
- **TanStack Query** (cache de dados)
- **Sonner** (notificações toast)

### Configuração Firebase

1. Crie um projeto em [firebase.google.com](https://firebase.google.com)
2. Habilite **Authentication** (Email/Password)
3. Habilite **Realtime Database**
4. Copie credenciais para `src/auth/authConfig.ts`

### Configuração Claude AI (Importar Receitas com IA)

1. Crie uma conta em [console.anthropic.com](https://console.anthropic.com/)
2. Gere uma API Key
3. Adicione ao `.env.local`:
   ```env
   VITE_ANTHROPIC_API_KEY=your_api_key_here
   ```

**Custo:** Aproximadamente $0.001 por receita processada

### Variáveis de Ambiente

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_ANTHROPIC_API_KEY=...  # Claude API para importar receitas
# ... outras configs
```

---

## 🚀 Como Contribuir

1. Clone o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Siga a estrutura de pastas
4. Use TypeScript em tudo
5. Faça commits descritivos
6. Abra um Pull Request

---

## 📖 Guia Rápido por Tarefa

### Adicionar Nova Página

1. Crie arquivo em `src/pages/`
2. Adicione rota em `src/App.tsx`
3. Importe componentes necessários

### Criar Novo Componente

1. Crie em `src/components/[categoria]/`
2. Use Shadcn/UI para componentes base
3. Exporte em `index.ts` (se aplicável)

### Modificar CRUD

1. Edite métodos em `src/data/repositories/FirebaseRepository.ts`
2. Atualize interface em `src/data/repositories/types.ts`
3. Use através de `useRecipes()` nos componentes

### Adicionar Novo Tipo

1. Adicione em `src/types/recipe.ts`
2. Atualize interfaces relacionadas
3. Update CRUD se necessário

---

## 📞 Suporte

Para dúvidas sobre a arquitetura ou localização de arquivos, consulte este README usando a busca (Ctrl+F).

---

**Última atualização**: 22 de dezembro de 2025
