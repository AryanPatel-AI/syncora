import React from 'react';

interface CategoryPillsProps {
  categories: { id: string; name: string }[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
            selectedCategory === cat.id
              ? 'bg-[#D1FAE5] text-[#09140F] shadow-md shadow-white/5'
              : 'bg-[#193225] text-[#8E919C] hover:text-[#D1FAE5] hover:bg-[#234735] border border-[#234735]'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};
