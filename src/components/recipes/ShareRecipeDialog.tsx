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
  ExternalLink,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { Recipe } from "@/types/recipe";
import { getRepository } from "@/data/repositories";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  copyShareLinkToClipboard,
  createShareLink,
  generateShareQRCode,
  shareViaEmail,
  shareViaWhatsApp,
} from "@/lib/recipeSharing";
import { useAuth } from "@/auth/AuthContext";

interface ShareRecipeDialogProps {
  recipe: Recipe;
}

interface ShareableRepository {
  shareRecipe(recipeId: string): Promise<string>;
}

export function ShareRecipeDialog({ recipe }: ShareRecipeDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const repository = getRepository() as unknown as ShareableRepository;
      const shareId = await repository.shareRecipe(recipe.id);
      const link = createShareLink(shareId);
      const qrCode = await generateShareQRCode(link);
      setShareLink(link);
      setQrCodeUrl(qrCode);
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
      await copyShareLinkToClipboard(shareLink);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const handleShareWhatsApp = () => {
    shareViaWhatsApp(recipe.title, shareLink);
  };

  const handleShareEmail = () => {
    shareViaEmail(recipe.title, shareLink);
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
            Gere um link limpo, identifique a autoria e compartilhe "{recipe.title}" por link, mensagem ou QR code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!shareLink ? (
            <>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="text-sm font-medium text-foreground">
                  Compartilhado por
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {user?.displayName || user?.email || "Você"}
                </p>
              </div>

              <Button
                onClick={handleGenerateLink}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Preparando compartilhamento..." : "Gerar link de compartilhamento"}
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Link compartilhável
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Compartilhado por {user?.displayName || user?.email || "você"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(shareLink, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3">
                  <Input value={shareLink} readOnly className="text-sm" />
                </div>
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
                <Button
                  onClick={handleGenerateLink}
                  variant="outline"
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Novo link
                </Button>
              </div>

              <Separator />

              <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    QR code da receita
                  </p>
                </div>
                <div className="flex justify-center rounded-2xl bg-white p-4">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt={`QR code para compartilhar ${recipe.title}`}
                      className="h-52 w-52"
                    />
                  ) : null}
                </div>
              </div>

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
