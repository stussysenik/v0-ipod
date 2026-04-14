"use client";

import { getTextTokenCss } from "@/lib/color-manifest";

interface StarRatingProps {
	rating: number;
	onChange: (rating: number) => void;
	disabled?: boolean;
	fontSize?: number;
}

const INACTIVE_STAR_COLOR = "#BDBDBD";

export function StarRating({ rating, onChange, disabled = false, fontSize = 9 }: StarRatingProps) {
	return (
		<div className="flex items-center gap-[1px]" style={{ lineHeight: 1 }}>
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					className="appearance-none p-0 leading-none focus:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
					disabled={disabled}
					style={{
						fontSize,
						color:
							star <= rating
								? getTextTokenCss("screen.artist")
								: INACTIVE_STAR_COLOR,
					}}
					onClick={() => onChange(star)}
				>
					★
				</button>
			))}
		</div>
	);
}
