export default function CategoryBadge({ category }) {
  return (
    <span className="inline-block text-[10px] tracking-[0.18em] uppercase font-semibold text-[#012D76] border border-[#E5EBF2] bg-white px-2.5 py-1">
      {category}
    </span>
  );
}
