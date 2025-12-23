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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getRepository } from "@/data/repositories";
import { Recipe } from "@/types/recipe";

interface SharedRecipeRepository {
  getSharedRecipe(
    shareId: string,
  ): Promise<(Recipe & { authorId: string }) | null>;
}

export function ImportSharedRecipeDialog() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const extractShareId = (url: string): string | null => {
    try {
      // Tenta extrair do formato: https://exemplo.com/compartilhar/abc123
      const match = url.match(/\/compartilhar\/([a-zA-Z0-9]+)$/);
      if (match && match[1]) {
        return match[1];
      }

      // Se for apenas o ID
      if (url.match(/^[a-zA-Z0-9]+$/) && url.length > 5) {
        return url;
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleImport = async () => {
    const shareId = extractShareId(link.trim());

    if (!shareId) {
      toast.error(
        "Link inválido. Cole um link compartilhado ou apenas o ID da receita.",
      );
      return;
    }

    setLoading(true);
    try {
      const repository = getRepository() as unknown as SharedRecipeRepository;
      const sharedRecipe = await repository.getSharedRecipe(shareId);

      if (!sharedRecipe) {
        toast.error(
          "Receita não encontrada. Verifique o link e tente novamente.",
        );
        setLoading(false);
        return;
      }

      toast.success("Receita encontrada!");
      setLink("");
      setOpen(false);

      // Redireciona para a página da receita compartilhada
      navigate(`/compartilhar/${shareId}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao buscar receita compartilhada";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && link.trim()) {
      handleImport();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Receita Compartilhada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar Receita Compartilhada
          </DialogTitle>
          <DialogDescription>
            Cole o link ou ID da receita compartilhada que você recebeu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-link">Link ou ID da Receita</Label>
            <Input
              id="share-link"
              placeholder="Cole aqui: https://exemplo.com/compartilhar/abc123 ou apenas abc123"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="font-mono text-sm"
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 space-y-2">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Opção 1:</strong> Cole o link completo que recebeu
              </span>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Opção 2:</strong> Cole apenas o ID (parte final do link)
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={loading || !link.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Buscando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
