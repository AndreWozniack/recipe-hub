import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Clock3,
  PlayCircle,
  Soup,
  Users,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecipes } from "@/contexts/RecipeContext";
import { DIFFICULTY_LABELS } from "@/types/recipe";
import {
  buildCookModeIngredients,
  getRecipeServings,
  parseInstructionSteps,
} from "@/lib/recipeCooking";
import {
  generateStructuredCookMode,
  StructuredCookStep,
} from "@/lib/recipeCookAI";
import { toast } from "sonner";

export default function CookRecipe() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { recipes, loading } = useRecipes();
  const recipe = useMemo(() => recipes.find((item) => item.id === id), [id, recipes]);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetServings, setTargetServings] = useState<number | string>("");
  const [steps, setSteps] = useState<StructuredCookStep[]>([]);
  const [cookSummary, setCookSummary] = useState("");
  const [cookModeLoading, setCookModeLoading] = useState(true);
  const [usingFallbackSteps, setUsingFallbackSteps] = useState(false);

  const baseServings = recipe ? getRecipeServings(recipe) : 1;
  const parsedTargetServings =
    typeof targetServings === "number"
      ? targetServings
      : Number.parseInt(String(targetServings), 10);
  const effectiveServings =
    Number.isFinite(parsedTargetServings) && parsedTargetServings > 0
      ? parsedTargetServings
      : baseServings;
  const multiplier = effectiveServings / baseServings;
  const adjustedIngredients = useMemo(
    () => buildCookModeIngredients(recipe?.ingredients || [], multiplier),
    [multiplier, recipe?.ingredients],
  );

  useEffect(() => {
    if (!recipe) {
      return;
    }

    let cancelled = false;

    const loadCookMode = async () => {
      setCookModeLoading(true);

      try {
        const cookMode = await generateStructuredCookMode(recipe);
        if (cancelled) {
          return;
        }
        setSteps(cookMode.steps);
        setCookSummary(cookMode.summary);
        setUsingFallbackSteps(false);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const fallbackSteps = parseInstructionSteps(recipe.instructions).map(
          (step) => ({
            id: step.id,
            title: step.title || step.text,
            instruction: step.instruction || step.text,
            estimatedMinutes: step.estimatedMinutes,
            ingredients: step.ingredients || [],
            tips: step.tips || [],
          }),
        );
        setSteps(fallbackSteps);
        setCookSummary(
          "Modo de preparo gerado localmente a partir das instruções da receita.",
        );
        setUsingFallbackSteps(true);
        toast.error(
          error instanceof Error
            ? `${error.message} Usando estrutura local da receita.`
            : "Não foi possível gerar o preparo guiado com IA. Usando estrutura local.",
        );
      } finally {
        if (!cancelled) {
          setCookModeLoading(false);
        }
      }
    };

    void loadCookMode();

    return () => {
      cancelled = true;
    };
  }, [recipe]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-8">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-8 text-center">
          <p className="text-muted-foreground">Receita não encontrada</p>
          <Button onClick={() => navigate("/")}>Voltar para receitas</Button>
        </div>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const progress = steps.length
    ? ((currentStepIndex + 1) / steps.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-fit rounded-[30px] border border-border/70 bg-card/90 p-6 shadow-card"
          >
            <Button
              variant="ghost"
              className="mb-4 w-fit gap-2"
              onClick={() => navigate(`/receita/${recipe.id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para receita
            </Button>

            <div className="rounded-[28px] bg-[linear-gradient(160deg,_hsl(25_95%_53%_/_0.15),_hsl(35_95%_60%_/_0.06),_hsl(142_60%_45%_/_0.08))] p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80">
                <ChefHat className="h-7 w-7 text-primary" />
              </div>
              <h1 className="mt-5 font-display text-3xl text-foreground">
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="mt-3 leading-7 text-muted-foreground">
                  {recipe.description}
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {recipe.prepTime && (
                <div className="rounded-2xl bg-secondary/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Clock3 className="h-4 w-4 text-primary" />
                    Tempo
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {recipe.prepTime} min
                  </p>
                </div>
              )}
              <div className="rounded-2xl bg-secondary/60 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Porções
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Base: {baseServings}
                </p>
              </div>
              {recipe.difficulty && (
                <div className="rounded-2xl bg-secondary/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Soup className="h-4 w-4 text-primary" />
                    Nível
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {DIFFICULTY_LABELS[recipe.difficulty]}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 p-4">
              <label className="text-sm font-medium text-foreground">
                Ajustar porções para esta execução
              </label>
              <div className="mt-3 flex gap-2">
                {[baseServings, baseServings * 2, Math.max(1, Math.round(baseServings / 2))].map(
                  (servings) => (
                    <Button
                      key={servings}
                      variant={
                        effectiveServings === servings ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setTargetServings(servings)}
                    >
                      {servings}
                    </Button>
                  ),
                )}
              </div>
              <div className="mt-3">
                <Input
                  type="number"
                  min={1}
                  value={targetServings}
                  onChange={(event) => setTargetServings(event.target.value)}
                  placeholder={`Ex: ${baseServings}`}
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Ingredientes ajustados
                </p>
                <span className="text-xs text-muted-foreground">
                  {effectiveServings} porções
                </span>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-foreground">
                {adjustedIngredients.map((ingredient) => (
                  <li key={ingredient.id} className="rounded-xl bg-secondary/40 p-3">
                    <span className="font-medium">
                      {[ingredient.quantity, ingredient.unit]
                        .filter(Boolean)
                        .join(" ")}
                    </span>{" "}
                    {ingredient.name}
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                    Fazer receita
                  </p>
                  <h2 className="mt-2 font-display text-4xl text-foreground">
                    {hasStarted ? "Modo de preparo guiado" : "Preparar para cozinhar"}
                  </h2>
                  <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                    {cookSummary ||
                      (hasStarted
                        ? "Siga um passo por vez, ajuste as porções e avance sem se perder no texto."
                        : "Revise os ingredientes ajustados, depois comece a execução passo a passo da receita.")}
                  </p>
                </div>

                {!hasStarted ? (
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => setHasStarted(true)}
                    disabled={cookModeLoading || steps.length === 0}
                  >
                    {cookModeLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <PlayCircle className="h-5 w-5" />
                    )}
                    {cookModeLoading ? "Montando preparo..." : "Começar preparo"}
                  </Button>
                ) : (
                  <div className="min-w-[200px]">
                    <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Passo {currentStepIndex + 1} de {steps.length}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!hasStarted ? (
              <div className="rounded-[30px] border border-dashed border-primary/30 bg-primary/5 p-8">
                <div className="max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm text-primary shadow-card">
                    <CheckCircle2 className="h-4 w-4" />
                    Tudo pronto para cozinhar
                  </div>
                  <h3 className="font-display text-3xl text-foreground">
                    Ajuste o que precisar antes de começar
                  </h3>
                  <p className="leading-7 text-muted-foreground">
                    Esta primeira versão já permite adaptar as porções e seguir
                    cada etapa separadamente. O objetivo é deixar o preparo
                    mais fluido no celular ou no balcão da cozinha.
                  </p>
                  {usingFallbackSteps && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm text-muted-foreground shadow-card">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      A estrutura foi montada localmente porque a IA não respondeu.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-[30px] border border-border/70 bg-card/95 p-8 shadow-card">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                    Etapa atual
                  </p>
                  <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
                    {currentStep?.title || `Passo ${currentStepIndex + 1}`}
                  </p>
                  <h3 className="mt-3 font-display text-4xl leading-tight text-foreground">
                    {currentStep?.instruction}
                  </h3>
                  {!!currentStep?.estimatedMinutes && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Cerca de {currentStep.estimatedMinutes} min nesta etapa
                    </p>
                  )}
                  {!!currentStep?.ingredients?.length && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {currentStep.ingredients.map((ingredient) => (
                        <span
                          key={ingredient}
                          className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  )}
                  {!!currentStep?.tips?.length && (
                    <div className="mt-5 rounded-2xl bg-secondary/50 p-4">
                      <p className="text-sm font-medium text-foreground">Dicas</p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                        {currentStep.tips.map((tip) => (
                          <li key={tip}>- {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() =>
                        setCurrentStepIndex((prev) => Math.max(0, prev - 1))
                      }
                      disabled={currentStepIndex === 0}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Passo anterior
                    </Button>

                    {currentStepIndex < steps.length - 1 ? (
                      <Button
                        className="gap-2"
                        onClick={() =>
                          setCurrentStepIndex((prev) =>
                            Math.min(steps.length - 1, prev + 1),
                          )
                        }
                      >
                        Próximo passo
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        className="gap-2"
                        onClick={() => navigate(`/receita/${recipe.id}`)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Finalizar preparo
                      </Button>
                    )}
                  </div>
                </div>

                <div className="rounded-[30px] border border-border/70 bg-card/95 p-6 shadow-card">
                  <p className="text-sm font-medium text-foreground">
                    Todas as etapas
                  </p>
                  <div className="mt-4 grid gap-3">
                    {steps.map((step, index) => (
                      <button
                        key={step.id}
                        onClick={() => setCurrentStepIndex(index)}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          index === currentStepIndex
                            ? "border-primary/30 bg-primary/10"
                            : "border-border/70 bg-background hover:bg-secondary/40"
                        }`}
                      >
                        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Passo {index + 1}
                        </span>
                        <p className="mt-1 text-sm leading-6 text-foreground">
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {step.instruction}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        </div>
      </main>
    </div>
  );
}
