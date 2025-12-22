import { useState } from "react";
import { Loader2, Upload, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { parseRecipeWithAI, AIRecipeResponse } from "@/lib/recipeAI";
import { toast } from "sonner";

interface ImportRecipeDialogProps {
  onRecipeImported?: (recipeData: AIRecipeResponse) => void;
}

export function ImportRecipeDialog({
  onRecipeImported,
}: ImportRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [recipeText, setRecipeText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!recipeText.trim()) {
      toast.error("Cole o texto da receita para importar");
      return;
    }

    setLoading(true);
    try {
      const toastId = toast.loading("Processando receita com IA...");

      const parsedRecipe = await parseRecipeWithAI(recipeText);

      toast.dismiss(toastId);
      toast.success("Receita processada com sucesso!");

      setRecipeText("");
      setOpen(false);

      onRecipeImported?.(parsedRecipe);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao importar receita. Tente novamente.";
      toast.error(message);
      console.error("Erro ao importar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wand2 className="h-4 w-4" />
          Importar com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Importar Receita com IA
          </DialogTitle>
          <DialogDescription>
            Cole o texto de qualquer receita e deixe a IA estruturar para você.
            Funciona com receitas de blogs, PDFs, ou qualquer formato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipe-text">Texto da Receita</Label>
            <Textarea
              id="recipe-text"
              placeholder="Cole a receita aqui... Pode ser de um blog, PDF, ou até uma foto transcrita"
              value={recipeText}
              onChange={(e) => setRecipeText(e.target.value)}
              rows={10}
              disabled={loading}
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            💡 <strong>Dica:</strong> Quanto mais detalhes sobre a receita você
            fornecer, melhor será o resultado. Inclua ingredientes, modo de
            preparo, tempo, dificuldade, etc.
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || !recipeText.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Processando..." : "Importar com IA"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
