/**
 * Portfolio media — photos & videos served on the iPod's Photos/Videos screens.
 *
 * These are sourced from a shared Google Drive folder. Until the Drive assets
 * are pulled in, the lists are empty and the screens render a tasteful empty
 * state ("Syncing from Drive…"). When the assets land, populate `photos` and
 * `videos` below (or swap to a runtime loader) and the screens light up with no
 * other changes — the screen components only know about these shapes.
 *
 * Drive folder:
 *   https://drive.google.com/drive/folders/1sLD0sVdrR5X-hRcR1uBHBTmfRi20TO1o
 */

export interface PhotoItem {
	id: string;
	title: string;
	/** Full-resolution / display URL. */
	src: string;
	/** Optional smaller thumbnail; falls back to `src`. */
	thumb?: string;
	series?: string;
}

export interface VideoItem {
	id: string;
	title: string;
	/** Playable URL (mp4/webm) or an embeddable preview URL. */
	src: string;
	/** Poster frame shown before playback. */
	poster?: string;
	duration?: string;
}

/**
 * Populated from `public/portfolio/{photos,videos}` via the media manifest.
 *
 * Workflow: drop files into those folders → run `npm run media:sync` (also runs
 * automatically before `dev`/`build`) → the manifest regenerates and these
 * arrays fill. While empty, the Photos/Videos screens show a graceful empty
 * state. (Drive assets land here once downloaded into the folder.)
 */
import manifest from "./media-manifest.json";

export const photos: PhotoItem[] = manifest.photos as PhotoItem[];

export const videos: VideoItem[] = manifest.videos as VideoItem[];

export const hasPhotos = () => photos.length > 0;
export const hasVideos = () => videos.length > 0;
