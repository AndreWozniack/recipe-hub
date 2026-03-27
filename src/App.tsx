import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RecipeProvider } from "@/contexts/RecipeContext";
import { AuthProvider } from "@/auth/AuthContext";
import { authConfig } from "@/auth/authConfig";
import { initializeRepository } from "@/data/repositories";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NewRecipe from "./pages/NewRecipe";
import ShoppingListPage from "./pages/ShoppingListPage";
import RecipeDetail from "./pages/RecipeDetail";
import SharedRecipe from "./pages/SharedRecipe";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/UserProfile";
import EditRecipe from "./pages/EditRecipe";
import Landing from "./pages/Landing";
import { useAuth } from "@/auth/AuthContext";

const queryClient = new QueryClient();

initializeRepository({
  provider: "firebase",
  firebaseConfig: authConfig.firebaseConfig!,
});

const HomeRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return isAuthenticated ? <Index /> : <Landing />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider config={authConfig}>
        <RecipeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/compartilhar/:shareId" element={<SharedRecipe />} />
              <Route
                path="/"
                element={<HomeRoute />}
              />
              <Route
                path="/nova-receita"
                element={
                  <ProtectedRoute>
                    <NewRecipe />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receita/:id"
                element={
                  <ProtectedRoute>
                    <RecipeDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receita/:id/editar"
                element={
                  <ProtectedRoute>
                    <EditRecipe />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lista-de-compras"
                element={
                  <ProtectedRoute>
                    <ShoppingListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </RecipeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
