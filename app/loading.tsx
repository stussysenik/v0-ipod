import Image from "next/image";

export default function Loading() {
	return (
		<main>
			<div className="min-h-screen w-full flex items-center justify-center bg-[#F9F9F9]">
				<img
					src="/loading-point.png"
					alt="Loading"
					className="max-w-full max-h-screen object-contain"
				/>
			</div>
		</main>
	);
}
