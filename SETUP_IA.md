# 🤖 Configuração do Sistema de Importação com IA

## Resumo Rápido

Este guia explica como configurar e usar o sistema de importação de receitas com IA (Claude) no Recipe Hub.

## 1️⃣ Obter API Key da Anthropic

1. Acesse [console.anthropic.com](https://console.anthropic.com/)
2. Faça login ou crie uma conta
3. Vá para **API Keys** → **Create Key**
4. Copie a chave gerada

## 2️⃣ Configurar Variável de Ambiente

1. Crie arquivo `.env.local` na raiz do projeto (se não existir)
2. Adicione:
   ```
   VITE_ANTHROPIC_API_KEY=sua_chave_aqui
   ```
3. Salve o arquivo

## 3️⃣ Usar o Sistema

### No site:

1. Clique em "Nova Receita"
2. Clique no botão "Importar com IA" (ícone mágico ✨)
3. Cole o texto de qualquer receita (blog, PDF, texto livre)
4. Clique em "Processar"
5. A IA estruturará a receita automaticamente
6. Revise os campos preenchidos
7. Clique em "Salvar"

## 💰 Custo

- **~$0.001 por receita processada**
- Modelo usado: `claude-3-5-sonnet-20241022`
- Preço: $3/MTok entrada, $15/MTok saída

## 📝 O que a IA Extrai

- ✅ Título da receita
- ✅ Descrição/resumo
- ✅ Lista de ingredientes (com quantidades e unidades)
- ✅ Modo de preparo
- ✅ Tempo de preparo
- ✅ Número de porções
- ✅ Dificuldade (fácil, médio, difícil)
- ✅ Categorias automáticas

## 🔧 Troubleshooting

### Erro "Invalid API Key"

- Verifique se a chave foi copiada corretamente
- Verifique se está em `.env.local` (não em `.env`)
- Restart o servidor de desenvolvimento

### Erro "Invalid request"

- Certifique-se de que o texto da receita tem pelo menos 50 caracteres
- Tente com uma receita bem estruturada primeiro

### Campos vazios após importar

- A IA pode ter dificuldade com formatos muito diferentes
- Revise manualmente e adicione informações faltantes

## 📚 Arquivos Relacionados

- `src/lib/recipeAI.ts` - Serviço Claude
- `src/components/recipes/ImportRecipeDialog.tsx` - Component da UI
- `src/components/recipes/RecipeForm.tsx` - Formulário integrado
- `.env.example` - Template de variáveis

## 🚀 Próximos Passos

- Testar com diferentes formatos de receita
- Adicionar suporte para OCR de fotos de receitas (futura feature)
- Melhorar prompt para reconhecer mais categorias

---

Precisa de ajuda? Abra uma issue no repositório! 💬
