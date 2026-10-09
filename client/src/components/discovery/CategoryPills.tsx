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
              ? 'bg-[#F2F0E9] text-[#101114] shadow-md shadow-white/5'
              : 'bg-[#1C1E24] text-[#8E919C] hover:text-[#F2F0E9] hover:bg-[#282A33] border border-[#282A33]'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};
