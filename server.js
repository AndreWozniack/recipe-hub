import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3001;

app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.post("/api/parseRecipe", async (req, res) => {
  try {
    const { recipeText } = req.body;

    if (!recipeText || recipeText.trim().length < 50) {
      return res.status(400).json({
        error: "Texto da receita deve ter pelo menos 50 caracteres",
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "API key não configurada no servidor",
      });
    }

    const prompt = `Você é um assistente especializado em receitas. Analise o seguinte texto de receita e estruture em JSON.

Texto da receita:
${recipeText}

Retorne APENAS um JSON válido (sem markdown, sem código blocks) com esta estrutura:
{
  "title": "Nome da receita",
  "description": "Descrição breve",
  "ingredients": [
    {"id": "uuid", "name": "ingrediente", "quantity": "1", "unit": "xícara"}
  ],
  "instructions": "Modo de preparo em parágrafo único",
  "prepTime": 30,
  "servings": 4,
  "difficulty": "medio",
  "categories": ["entrada", "prato-principal", "sobremesa", "tempero", "acompanhamento", "lanche", "drink", "molho", "salada"]
}

Notas:
- Para dificuldade, use APENAS: "facil", "medio" ou "dificil" (sem acentos)
- Para categorias, use APENAS valores da lista acima (sem acentos, com hífen onde indicado)
- Gere UUIDs aleatórios para cada ingrediente
- Se campo não existir na receita, omita ou deixe null
- Seja sucinto na descrição (máximo 200 caracteres)`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Erro da API Anthropic:", error);
      return res.status(response.status).json({
        error: "Erro ao processar receita. Tente novamente.",
        details: error,
      });
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      return res.status(500).json({
        error: "Resposta vazia da API",
      });
    }

    // Limpar markdown code blocks se existirem
    let jsonString = content.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    const parsedRecipe = JSON.parse(jsonString);

    if (!parsedRecipe.title) {
      return res.status(400).json({
        error: "IA não conseguiu extrair o título da receita",
      });
    }

    // Garantir que ingredients tem IDs
    if (parsedRecipe.ingredients && Array.isArray(parsedRecipe.ingredients)) {
      parsedRecipe.ingredients = parsedRecipe.ingredients.map((ing) => ({
        ...ing,
        id: ing.id || crypto.randomUUID(),
      }));
    }

    // Garantir categorias como array
    if (!Array.isArray(parsedRecipe.categories)) {
      parsedRecipe.categories = [];
    }

    return res.status(200).json(parsedRecipe);
  } catch (error) {
    console.error("Erro ao processar receita:", error);

    if (error instanceof SyntaxError) {
      return res.status(400).json({
        error: "Resposta da IA não é um JSON válido",
        details: error.message,
      });
    }

    return res.status(500).json({
      error: "Erro ao processar receita. Tente novamente.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor API rodando em http://localhost:${port}`);
});
