# 🔧 Configuração do Backend (API Proxy para Claude)

## 📋 O que mudou?

O sistema agora usa um **backend proxy** para chamar a API da Claude de forma segura:

1. **Frontend** (React) → Chama `/api/parseRecipe`
2. **Backend** (Node.js/Express) → Chama API da Claude
3. **Claude API** → Retorna receita estruturada

**Benefícios:**

- ✅ Sua API key fica segura no servidor
- ✅ Sem erros de CORS
- ✅ Suporta Vercel em produção
- ✅ Desenvolvimento local com `npm run dev`

---

## 🚀 Como Rodar em Desenvolvimento

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure o arquivo `.env`

Crie (ou já existe) arquivo `.env` na raiz do projeto:

```
ANTHROPIC_API_KEY=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
```

### 3. Inicie o servidor (faz todo o setup automaticamente)

```bash
npm run dev
```

Isso vai:

- Rodar o **Express server** na porta `3001` (backend)
- Rodar o **Vite dev server** na porta `8080` (frontend)
- Proxy `/api` do frontend para o backend

### Pronto! 🎉

- Acesse: **http://localhost:8080**
- Backend rodando em: **http://localhost:3001**
- API endpoint: **POST /api/parseRecipe**

---

## 📂 Arquivos Importantes

### Backend

- **`server.js`** - Servidor Express que faz proxy para Claude
- **`api/parseRecipe.ts`** - Endpoint que recebe receita e processa com Claude

### Frontend

- **`src/lib/recipeAI.ts`** - Cliente que chama `/api/parseRecipe`
- **`src/components/recipes/ImportRecipeDialog.tsx`** - UI do dialog de importação
- **`vite.config.ts`** - Configuração de proxy

### Configuração

- **`.env`** - Variáveis de servidor (NÃO committar!)
- **`.env.local`** - Variáveis do frontend (vazio/docs)

---

## 🌐 Deploy em Produção (Vercel)

A estrutura já é compatível com Vercel:

1. **Crie conta em** https://vercel.com
2. **Conecte seu repositório GitHub**
3. **Configure as variáveis:**
   - Vá em **Settings → Environment Variables**
   - Adicione: `ANTHROPIC_API_KEY=sua_chave`
4. **Deploy automático!**

Vercel vai:

- Servir o build do Vite
- Rodar o `api/parseRecipe.ts` como serverless function

---

## 🧪 Testando a API

### Com curl:

```bash
curl -X POST http://localhost:3001/api/parseRecipe \
  -H "Content-Type: application/json" \
  -d '{
    "recipeText": "Bolo de chocolate: 2 xícaras de farinha, 1 xícara de açúcar, 3 ovos..."
  }'
```

### Com JavaScript:

```javascript
const response = await fetch("/api/parseRecipe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    recipeText: "Sua receita aqui...",
  }),
});

const recipe = await response.json();
console.log(recipe);
```

---

## 🐛 Troubleshooting

### Erro: "ENOENT: no such file or directory, open '.env'"

→ Crie o arquivo `.env` na raiz

### Erro: "connect ECONNREFUSED 127.0.0.1:3001"

→ O servidor Express não está rodando. Execute `npm run dev`

### Erro: "Failed to fetch"

→ Verifique se o servidor Express está rodando (porta 3001)

### API Key inválida

→ Verifique se você copiou a chave corretamente no `.env`

---

## 📚 Estrutura de Pastas

```
recipe-hub/
├── api/
│   └── parseRecipe.ts           # Endpoint serverless para Vercel
├── src/
│   ├── lib/
│   │   └── recipeAI.ts          # Cliente que chama /api/parseRecipe
│   └── components/recipes/
│       └── ImportRecipeDialog.tsx
├── server.js                    # Express server para dev
├── vite.config.ts               # Config com proxy
├── .env                         # API Key (não committar!)
└── .env.local                   # Vazio (frontend não precisa da key)
```

---

## 🔐 Segurança

⚠️ **IMPORTANTE:**

- **NUNCA** commite `.env` com sua API key
- Já está no `.gitignore`? Confira!
- Use variáveis de ambiente em produção (Vercel Settings)
- Regenere a API key se vazar acidentalmente

---

Pronto para testar! 🚀
