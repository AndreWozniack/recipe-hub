import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RecipeProvider } from "@/contexts/RecipeContext";
import Index from "./pages/Index";
import NewRecipe from "./pages/NewRecipe";
import ShoppingListPage from "./pages/ShoppingListPage";
import RecipeDetail from "./pages/RecipeDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RecipeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/nova-receita" element={<NewRecipe />} />
            <Route path="/receita/:id" element={<RecipeDetail />} />
            <Route path="/lista-de-compras" element={<ShoppingListPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RecipeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
