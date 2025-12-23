import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Header } from "@/components/layout/Header";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Camera, Save, X } from "lucide-react";
import { getAuth, updateProfile, updateEmail } from "firebase/auth";

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("Usuário não autenticado");
      }

      // Atualizar perfil
      if (displayName !== user.displayName || photoURL !== user.photoURL) {
        await updateProfile(currentUser, {
          displayName: displayName || null,
          photoURL: photoURL || null,
        });
      }

      // Atualizar email se mudou
      if (email && email !== user.email) {
        await updateEmail(currentUser, email);
      }

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      let errorMessage = "Não foi possível atualizar seu perfil.";

      if (error instanceof Error) {
        if (error.message.includes("requires-recent-login")) {
          errorMessage =
            "Por segurança, faça login novamente antes de alterar seu email.";
        } else if (error.message.includes("email-already-in-use")) {
          errorMessage = "Este email já está em uso.";
        }
      }

      toast({
        title: "Erro ao atualizar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user?.displayName || "");
    setEmail(user?.email || "");
    setPhotoURL(user?.photoURL || "");
    setIsEditing(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">
              Meu Perfil
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize seus dados e foto de perfil
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <User className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={photoURL || undefined}
                    alt={displayName || "Usuário"}
                  />
                  <AvatarFallback className="text-2xl">
                    {displayName?.charAt(0) || email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="w-full max-w-md">
                    <Label htmlFor="photoURL" className="text-sm font-medium">
                      URL da Foto
                    </Label>
                    <div className="relative mt-1.5">
                      <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="photoURL"
                        type="url"
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="pl-10"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium">
                  Nome de Exibição
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Seu nome"
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                ) : (
                  <p className="text-foreground px-3 py-2 bg-secondary/50 rounded-md">
                    {displayName || "Não informado"}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                ) : (
                  <p className="text-foreground px-3 py-2 bg-secondary/50 rounded-md">
                    {email || "Não informado"}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Alterar o email pode exigir uma nova autenticação
                  </p>
                )}
              </div>

              {/* ID do Usuário */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">ID do Usuário</Label>
                <p className="text-foreground px-3 py-2 bg-secondary/50 rounded-md text-xs font-mono">
                  {user.id}
                </p>
              </div>

              {/* Botões de ação */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={isSaving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>Detalhes sobre sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">
                  Status da conta
                </span>
                <span className="text-sm font-medium text-green-600">
                  Ativa
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">
                  Método de login
                </span>
                <span className="text-sm font-medium">
                  {user.email ? "Email/Senha" : "Google"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
