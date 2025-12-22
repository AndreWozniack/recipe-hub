/**
 * Cria um link de compartilhamento
 */
export function createShareLink(shareId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/compartilhar/${shareId}`;
}

/**
 * Copia o link para a área de transferência
 */
export async function copyShareLinkToClipboard(link: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(link);
  } catch (error) {
    console.error("Erro ao copiar link:", error);
    throw new Error("Não foi possível copiar o link");
  }
}

/**
 * Compartilha via WhatsApp
 */
export function shareViaWhatsApp(recipeTitle: string, link: string): void {
  const text = `Confira esta receita de *${recipeTitle}*: ${link}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, "_blank");
}

/**
 * Compartilha via Email
 */
export function shareViaEmail(recipeTitle: string, link: string): void {
  const subject = `Compartilhei uma receita com você: ${recipeTitle}`;
  const body = `Veja esta receita incrível: ${link}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
  window.open(emailUrl);
}

/**
 * Compartilha via Facebook
 */
export function shareViaFacebook(link: string): void {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    link
  )}`;
  window.open(facebookUrl, "_blank", "width=600,height=400");
}
