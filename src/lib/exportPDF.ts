// src/lib/exportPDF.ts
import { Recipe } from "@/types/recipe";

export function exportRecipeToPDF(recipe: Recipe) {
  const categoryLabels = recipe.categories
    .map((catId) => {
      const categories = [
        { id: "breakfast", label: "Café da Manhã", icon: "🌅" },
        { id: "lunch", label: "Almoço", icon: "🍽️" },
        { id: "dinner", label: "Jantar", icon: "🌙" },
        { id: "dessert", label: "Sobremesa", icon: "🍰" },
        { id: "snack", label: "Lanche", icon: "🥪" },
        { id: "beverage", label: "Bebida", icon: "🥤" },
      ];
      return categories.find((c) => c.id === catId)?.label || "";
    })
    .filter(Boolean);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${recipe.title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #ff6b6b;
            padding-bottom: 20px;
          }
          h1 {
            margin: 0;
            font-size: 32px;
            color: #ff6b6b;
          }
          .description {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
            font-style: italic;
          }
          .meta-info {
            display: flex;
            gap: 20px;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          .meta-item {
            padding: 8px 12px;
            background: #f5f5f5;
            border-radius: 8px;
            font-size: 13px;
          }
          .categories {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
          }
          .category-badge {
            background: #ffe0e0;
            color: #ff6b6b;
            padding: 4px 10px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
          }
          h2 {
            color: #ff6b6b;
            border-bottom: 2px solid #ff6b6b;
            padding-bottom: 8px;
            margin-top: 30px;
            margin-bottom: 15px;
          }
          .ingredients-list {
            list-style: none;
            padding: 0;
          }
          .ingredients-list li {
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .ingredients-list li:last-child {
            border-bottom: none;
          }
          .ingredient-name {
            font-weight: 600;
          }
          .ingredient-qty {
            color: #666;
          }
          .instructions {
            white-space: pre-wrap;
            background: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            line-height: 1.8;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${recipe.title}</h1>
          ${recipe.description ? `<p class="description">${recipe.description}</p>` : ""}
          <div class="categories">
            ${categoryLabels.map((cat) => `<span class="category-badge">${cat}</span>`).join("")}
          </div>
        </div>

        <div class="meta-info">
          ${recipe.prepTime ? `<div class="meta-item">⏱️ Tempo: ${recipe.prepTime} min</div>` : ""}
          ${recipe.servings ? `<div class="meta-item">👥 Porções: ${recipe.servings}</div>` : ""}
          ${recipe.difficulty ? `<div class="meta-item">📊 Dificuldade: ${recipe.difficulty}</div>` : ""}
        </div>

        <h2>📋 Ingredientes</h2>
        <ul class="ingredients-list">
          ${recipe.ingredients
            .map(
              (ing) =>
                `<li><span class="ingredient-name">${ing.name}</span> ${
                  ing.quantity
                    ? `<span class="ingredient-qty">(${ing.quantity} ${ing.unit || ""})</span>`
                    : ""
                }</li>`,
            )
            .join("")}
        </ul>

        <h2>👨‍🍳 Modo de Preparo</h2>
        <div class="instructions">${recipe.instructions}</div>

        <div class="footer">
          <p>Gerado em ${new Date().toLocaleDateString("pt-BR")} - Recipe Hub</p>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open("", "", "height=800,width=800");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }
}
