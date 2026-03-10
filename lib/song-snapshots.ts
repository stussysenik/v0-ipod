import type { SongSnapshot } from "@/lib/storage";

export const TEST_SONG_SNAPSHOT: SongSnapshot = {
  metadata: {
    title: "Charcoal Baby",
    artist: "Blood Orange",
    album: "Negro Swan",
    artwork: "/placeholder-logo.png",
    duration: 244,
    currentTime: 5,
    rating: 5,
    trackNumber: 7,
    totalTracks: 16,
  },
  ui: {
    skinColor: "#FBFBF8",
    bgColor: "#F4F4EF",
    viewMode: "flat",
  },
};
