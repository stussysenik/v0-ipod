"use client"

interface StarRatingProps {
  rating: number
  onChange: (rating: number) => void
}

export function StarRating({ rating, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-black rounded"
        >
          <span className={`text-sm ${star <= rating ? "text-black" : "text-gray-300"}`}>★</span>
        </button>
      ))}
    </div>
  )
}

