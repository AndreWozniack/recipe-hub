import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Recipe } from "@/types/recipe";
import { getRepository } from "@/data/repositories";
import { Separator } from "@/components/ui/separator";

interface ShareRecipeDialogProps {
  recipe: Recipe;
}

interface ShareableRepository {
  shareRecipe(recipeId: string): Promise<string>;
}

export function ShareRecipeDialog({ recipe }: ShareRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const repository = getRepository() as unknown as ShareableRepository;
      const shareId = await repository.shareRecipe(recipe.id);
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/compartilhar/${shareId}`;
      setShareLink(link);
      toast.success("Link de compartilhamento gerado!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao gerar link";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Confira esta receita de *${recipe.title}*: ${shareLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareEmail = () => {
    const subject = `Compartilhei uma receita com você: ${recipe.title}`;
    const body = `Veja esta receita incrível: ${shareLink}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Compartilhar Receita
          </DialogTitle>
          <DialogDescription>
            Compartilhe "{recipe.title}" com seus amigos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!shareLink ? (
            <Button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Gerando..." : "Gerar Link de Compartilhamento"}
            </Button>
          ) : (
            <>
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                <p className="break-all text-sm text-muted-foreground">
                  {shareLink}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Compartilhar via:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleShareWhatsApp}
                    variant="outline"
                    className="gap-2"
                    size="sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={handleShareEmail}
                    variant="outline"
                    className="gap-2"
                    size="sm"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
