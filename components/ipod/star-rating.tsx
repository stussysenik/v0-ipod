"use client";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  fontSize?: number;
}

export function StarRating({
  rating,
  onChange,
  disabled = false,
  fontSize = 9,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-[1px]" style={{ lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => {
            if (disabled) return;
            onChange(star);
          }}
          disabled={disabled}
          className="rounded-[1px] p-0 leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          <span
            className={`leading-none ${star <= rating ? "text-black" : "text-gray-300"}`}
            style={{ fontSize }}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}
