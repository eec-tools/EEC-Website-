export default function CategoryTabs({ categories, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter blog posts by category">
      {categories.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat)}
            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
              isActive
                ? "bg-[#012D76] border-[#012D76] text-white"
                : "bg-transparent border-[#E5EBF2] text-[#3A4759] hover:border-[#012D76]/40 hover:text-[#012D76]"
            }`}
            data-testid={`blog-tab-${cat.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
