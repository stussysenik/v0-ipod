import type { SongSnapshot } from "@/lib/storage";

export const TEST_SONG_SNAPSHOT: SongSnapshot = {
  metadata: {
    title: "Have A Destination?",
    artist: "Mac Miller",
    album: "Balloonerism",
    artwork: "/mac-miller-test.jpg",
    duration: 334,
    currentTime: 5,
    rating: 5,
    trackNumber: 2,
    totalTracks: 10,
  },
  ui: {
    skinColor: "#F5F5F7",
    bgColor: "#D4D6D8",
    viewMode: "flat",
  },
};
