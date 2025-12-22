// Vercel Serverless API endpoint
// This file is automatically served by Vercel at /api/parseRecipe

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
  "categories": ["entrada", "prato-principal", "sobremesa"]
}

Notas:
- Para dificuldade, use APENAS: "facil", "medio" ou "dificil" (sem acentos)
- Para categorias, use APENAS valores válidos: "entrada", "prato-principal", "sobremesa", "tempero", "acompanhamento", "lanche", "drink", "molho", "salada"
- Gere UUIDs aleatórios para cada ingrediente
- Se campo não existir na receita, omita ou deixe null
- Seja sucinto na descrição`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet",
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
      });
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      return res.status(500).json({
        error: "Resposta vazia da API",
      });
    }

    // Limpar markdown code blocks
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

    if (!Array.isArray(parsedRecipe.categories)) {
      parsedRecipe.categories = [];
    }

    return res.status(200).json(parsedRecipe);
  } catch (error) {
    console.error("Erro ao processar receita:", error);

    if (error instanceof SyntaxError) {
      return res.status(400).json({
        error: "Resposta da IA não é um JSON válido",
      });
    }

    return res.status(500).json({
      error: "Erro ao processar receita. Tente novamente.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
