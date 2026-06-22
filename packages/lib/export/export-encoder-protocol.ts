export interface StartGifEncodingMessage {
	id: number;
	type: "start-gif";
	width: number;
	height: number;
}

export interface AppendGifFrameMessage {
	id: number;
	type: "append-gif-frame";
	frameIndex: number;
	width: number;
	height: number;
	delayMs: number;
	bitmap: ImageBitmap;
}

export interface StartMp4EncodingMessage {
	id: number;
	type: "start-mp4";
	width: number;
	height: number;
	frameRate: number;
	bitrate: number;
	codec?: string;
}

export interface AppendMp4FrameMessage {
	id: number;
	type: "append-mp4-frame";
	frameIndex: number;
	timestampUs: number;
	durationUs: number;
	bitmap: ImageBitmap;
}

export interface FinalizeEncodingMessage {
	id: number;
	type: "finalize";
}

export type EncoderWorkerRequest =
	| StartGifEncodingMessage
	| AppendGifFrameMessage
	| StartMp4EncodingMessage
	| AppendMp4FrameMessage
	| FinalizeEncodingMessage;

export type EncoderWorkerRequestPayload =
	| Omit<StartGifEncodingMessage, "id">
	| Omit<AppendGifFrameMessage, "id">
	| Omit<StartMp4EncodingMessage, "id">
	| Omit<AppendMp4FrameMessage, "id">
	| Omit<FinalizeEncodingMessage, "id">;

export interface EncoderWorkerOkResponse {
	id: number;
	type: "ok";
}

export interface EncoderWorkerFinalizedResponse {
	id: number;
	type: "finalized";
	buffer: ArrayBuffer;
	mimeType: string;
}

export interface EncoderWorkerErrorResponse {
	id: number;
	type: "error";
	error: string;
}

export interface EncoderWorkerProgressResponse {
	id: number;
	type: "progress";
	progress: number;
	detail?: string;
}

export type EncoderWorkerResponse =
	| EncoderWorkerOkResponse
	| EncoderWorkerFinalizedResponse
	| EncoderWorkerProgressResponse
	| EncoderWorkerErrorResponse;
