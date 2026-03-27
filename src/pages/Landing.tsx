import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  ChefHat,
  ClipboardList,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: BookOpen,
    title: "Seu livro de receitas digital",
    description:
      "Salve receitas da família, ideias da internet e criações próprias em um acervo bonito e organizado.",
  },
  {
    icon: ClipboardList,
    title: "Lista de compras automática",
    description:
      "Transforme receitas em lista de compras unificada e leve para o mercado sem improviso.",
  },
  {
    icon: Share2,
    title: "Compartilhamento simples",
    description:
      "Envie receitas por link para amigos, clientes ou familiares sem precisar exportar manualmente.",
  },
  {
    icon: Sparkles,
    title: "Importação com IA",
    description:
      "Cole um texto bruto e deixe a plataforma estruturar ingredientes, preparo e categorias.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_hsl(25_95%_53%_/_0.16),_transparent_30%),radial-gradient(circle_at_80%_20%,_hsl(142_60%_45%_/_0.14),_transparent_28%),linear-gradient(180deg,_hsl(40_33%_99%),_hsl(40_25%_96%))]" />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary shadow-card">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-foreground">
                Livro de Receitas
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                digital e compartilhavel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto grid gap-12 px-4 pb-20 pt-14 lg:grid-cols-[1.2fr_0.9fr] lg:items-center lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-sm text-primary shadow-card">
              <ShieldCheck className="h-4 w-4" />
              Organize, preserve e compartilhe suas melhores receitas
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Transforme suas receitas em um produto digital elegante.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Uma plataforma para salvar, editar, importar e compartilhar
                receitas com rapidez. Ideal para uso pessoal, creators de
                culinária, famílias e pequenos negócios gastronômicos.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2 px-8 text-base" asChild>
                <Link to="/auth">
                  Começar meu livro digital
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 text-base" asChild>
                <Link to="/compartilhar/demo">Ver experiência</Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/85 p-5 shadow-card">
                <p className="text-3xl font-semibold text-foreground">1 lugar</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  para guardar receitas, listas e links compartilhados
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 p-5 shadow-card">
                <p className="text-3xl font-semibold text-foreground">+ rápido</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  com importação por IA e edição sem fricção
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 p-5 shadow-card">
                <p className="text-3xl font-semibold text-foreground">+ bonito</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  do que planilhas, notas soltas e prints perdidos
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -left-6 top-10 h-28 w-28 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -right-6 bottom-16 h-28 w-28 rounded-full bg-accent/15 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/90 p-6 shadow-[0_24px_80px_-24px_hsl(25_30%_20%_/_0.25)] backdrop-blur">
              <div className="rounded-[24px] bg-[linear-gradient(135deg,_hsl(25_95%_53%_/_0.14),_hsl(35_95%_60%_/_0.05)_45%,_hsl(142_60%_45%_/_0.10))] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
                      Preview
                    </p>
                    <h2 className="mt-2 font-display text-2xl text-foreground">
                      Seu caderno culinario online
                    </h2>
                  </div>
                  <div className="rounded-full bg-background/80 px-3 py-1 text-sm text-primary shadow-card">
                    premium
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-background/90 p-4 shadow-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          Risoto de Cogumelos
                        </p>
                        <p className="text-sm text-muted-foreground">
                          4 porções • 35 min
                        </p>
                      </div>
                      <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        Compartilhável
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-background/80 p-4">
                      <p className="text-sm font-medium text-foreground">
                        Lista de compras
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <li>- arroz arbóreo</li>
                        <li>- cogumelos frescos</li>
                        <li>- caldo de legumes</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-background/80 p-4">
                      <p className="text-sm font-medium text-foreground">
                        Importação com IA
                      </p>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Cole uma receita de blog ou PDF e receba o conteúdo
                        estruturado em segundos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="container mx-auto px-4 pb-24">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-card"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-3 leading-7 text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
