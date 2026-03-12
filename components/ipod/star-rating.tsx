"use client";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRating({ rating, onChange, disabled = false }: StarRatingProps) {
  return (
    <div
      className="flex h-[10px] items-center gap-px"
      style={{ lineHeight: "var(--ipod-screen-status-leading)" }}
      data-testid="star-rating"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => {
            if (disabled) return;
            onChange(star);
          }}
          disabled={disabled}
          className="flex h-[10px] w-[10px] items-center justify-center rounded-[1px] leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:cursor-default"
          data-testid={`star-rating-button-${star}`}
        >
          <span
            className="block text-[9px] leading-none"
            style={{
              color:
                star <= rating ? "var(--ipod-star-active)" : "var(--ipod-star-inactive)",
            }}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}
