import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ChefHat,
  Mail,
  Lock,
  BookOpen,
  Share2,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Auth() {
  const navigate = useNavigate();
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    loading,
    error,
    isAuthenticated,
  } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      });
      navigate("/");
    } catch (err) {
      toast({
        title: "Erro no login",
        description:
          err instanceof Error
            ? err.message
            : "Falha ao fazer login com Google",
        variant: "destructive",
      });
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha.",
        variant: "destructive",
      });
      return;
    }
    try {
      await signInWithEmail(email, password);
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      });
      navigate("/");
    } catch (err) {
      toast({
        title: "Erro no login",
        description:
          err instanceof Error ? err.message : "Email ou senha incorretos",
        variant: "destructive",
      });
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A senha e confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    try {
      await signUpWithEmail(email, password);
      toast({
        title: "Conta criada!",
        description: "Sua conta foi criada com sucesso.",
      });
      navigate("/");
    } catch (err) {
      toast({
        title: "Erro ao criar conta",
        description:
          err instanceof Error ? err.message : "Falha ao criar conta",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_hsl(25_95%_53%_/_0.14),_transparent_30%),radial-gradient(circle_at_80%_25%,_hsl(142_60%_45%_/_0.12),_transparent_28%),linear-gradient(180deg,_hsl(40_33%_99%),_hsl(40_25%_96%))]" />

      <div className="container mx-auto grid min-h-screen gap-10 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="hidden lg:block">
          <div className="max-w-xl space-y-8">
            <Link
              to="/"
              className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/70 px-4 py-2 shadow-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary">
                <ChefHat className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-display text-xl text-foreground">
                  Livro de Receitas
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  digital e compartilhavel
                </p>
              </div>
            </Link>

            <div className="space-y-5">
              <h1 className="font-display text-6xl leading-[0.95] tracking-tight text-foreground">
                Guarde suas receitas como quem monta um acervo.
              </h1>
              <p className="text-lg leading-8 text-muted-foreground">
                Salve receitas em um livro digital bonito, busque rapidamente,
                compartilhe por link e gere listas de compras em segundos.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-card">
                <BookOpen className="h-5 w-5 text-primary" />
                <p className="mt-4 font-medium text-foreground">
                  Biblioteca pessoal
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Receitas organizadas por categoria, favoritas e busca.
                </p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-card">
                <Share2 className="h-5 w-5 text-primary" />
                <p className="mt-4 font-medium text-foreground">
                  Compartilhamento instantâneo
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Envie um link limpo para familiares, amigos ou clientes.
                </p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-card">
                <ClipboardList className="h-5 w-5 text-primary" />
                <p className="mt-4 font-medium text-foreground">
                  Lista de compras pronta
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Reúna ingredientes automaticamente antes de cozinhar.
                </p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-card">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="mt-4 font-medium text-foreground">
                  Importação com IA
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Converta receitas copiadas da internet em fichas organizadas.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-md border-border/70 bg-card/90 shadow-[0_24px_80px_-24px_hsl(25_30%_20%_/_0.28)] backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
              <ChefHat className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-3xl font-display">
                Seu livro de receitas digital
              </CardTitle>
              <CardDescription className="mt-2 text-sm leading-6">
                Entre para salvar receitas, compartilhar links e organizar tudo
                em um só lugar.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
          {/* Google Sign In */}
          <Button
            variant="outline"
            className="h-12 w-full text-base"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou use email</span>
            </div>
          </div>

          {/* Email/Password Tabs */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Acessar meu acervo"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando..." : "Criar meu livro digital"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="rounded-2xl bg-secondary/70 p-4 text-sm leading-6 text-muted-foreground">
            Ideal para uso pessoal, famílias, creators de culinária e pequenos
            negócios que querem organizar receitas de forma profissional.
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
