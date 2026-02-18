"use client";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRating({ rating, onChange, disabled = false }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5 pl-1" style={{ lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => {
            if (disabled) return;
            onChange(star);
          }}
          disabled={disabled}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-black rounded p-0.5 -m-0.5"
        >
          <span
            className={`text-[11px] ${star <= rating ? "text-black" : "text-gray-300"}`}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}
