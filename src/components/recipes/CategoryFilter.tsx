import { motion } from "framer-motion";
import { CATEGORIES, Category } from "@/types/recipe";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selectedCategories: Category[];
  onToggleCategory: (category: Category) => void;
  showAll?: boolean;
  onShowAll?: () => void;
}

export function CategoryFilter({
  selectedCategories,
  onToggleCategory,
  showAll,
  onShowAll,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {onShowAll && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShowAll}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all",
            showAll
              ? "bg-primary text-primary-foreground shadow-card"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          ✨ Todas
        </motion.button>
      )}
      {CATEGORIES.map((category) => {
        const isSelected = selectedCategories.includes(category.id);
        return (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggleCategory(category.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              isSelected
                ? "bg-primary text-primary-foreground shadow-card"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {category.icon} {category.label}
          </motion.button>
        );
      })}
    </div>
  );
}
