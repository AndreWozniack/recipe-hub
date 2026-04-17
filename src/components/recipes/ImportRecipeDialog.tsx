import { useState } from "react";
import { Loader2, Wand2, Link, FileText } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseRecipeWithAI, parseRecipeFromUrl, AIRecipeResponse } from "@/lib/recipeAI";
import { toast } from "sonner";

interface ImportRecipeDialogProps {
  onRecipeImported?: (recipeData: AIRecipeResponse) => void;
}

type Mode = "text" | "url";

export function ImportRecipeDialog({ onRecipeImported }: ImportRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("url");
  const [recipeText, setRecipeText] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setErrorMessage(null);
    const toastId = toast.loading("Processando receita com IA...");

    try {
      let parsedRecipe: AIRecipeResponse;

      if (mode === "url") {
        if (!recipeUrl.trim()) {
          toast.error("Cole a URL da receita");
          return;
        }
        parsedRecipe = await parseRecipeFromUrl(recipeUrl.trim());
      } else {
        if (!recipeText.trim()) {
          toast.error("Cole o texto da receita");
          return;
        }
        parsedRecipe = await parseRecipeWithAI(recipeText);
      }

      toast.success("Receita processada com sucesso!");
      setRecipeText("");
      setRecipeUrl("");
      setOpen(false);
      onRecipeImported?.(parsedRecipe);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao importar receita. Tente novamente.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      toast.dismiss(toastId);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
      setErrorMessage(null);
    }
  };

  const isValid = mode === "url" ? recipeUrl.trim().length > 0 : recipeText.trim().length >= 50;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!loading) { setOpen(next); if (!next) setErrorMessage(null); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wand2 className="h-4 w-4" />
          <span className="hidden sm:inline">Importar com IA</span>
          <span className="sm:hidden">IA</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Importar Receita com IA
          </DialogTitle>
          <DialogDescription>
            Cole a URL de um site de receitas ou o texto diretamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-secondary p-1">
            <button
              onClick={() => { setMode("url"); setErrorMessage(null); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                mode === "url"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Link className="h-4 w-4" />
              URL do site
            </button>
            <button
              onClick={() => { setMode("text"); setErrorMessage(null); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                mode === "text"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-4 w-4" />
              Colar texto
            </button>
          </div>

          {/* Input */}
          {mode === "url" ? (
            <div className="space-y-2">
              <Label htmlFor="recipe-url">URL da receita</Label>
              <Input
                id="recipe-url"
                type="url"
                placeholder="https://www.exemplo.com/receita-de-bolo"
                value={recipeUrl}
                onChange={(e) => setRecipeUrl(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => e.key === "Enter" && !loading && isValid && handleImport()}
              />
              <p className="text-xs text-muted-foreground">
                Funciona com a maioria dos sites de receitas.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="recipe-text">Texto da receita</Label>
              <Textarea
                id="recipe-text"
                placeholder="Cole a receita aqui... Pode ser de um blog, PDF, ou qualquer formato."
                value={recipeText}
                onChange={(e) => setRecipeText(e.target.value)}
                rows={8}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 50 caracteres. Quanto mais detalhes, melhor o resultado.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={loading || !isValid}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Processando..." : "Importar com IA"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
