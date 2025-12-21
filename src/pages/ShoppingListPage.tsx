import { Header } from '@/components/layout/Header';
import { ShoppingList } from '@/components/shopping/ShoppingList';

const ShoppingListPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <ShoppingList />
      </main>
    </div>
  );
};

export default ShoppingListPage;
