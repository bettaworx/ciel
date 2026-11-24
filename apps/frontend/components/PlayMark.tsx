import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The round play mark, shared by VideoPlayer's play button and a video's still
 * in a post's media, so the two look and animate the same.
 *
 * `hover: "self"` reacts to hovering the mark itself (the player's button).
 * `hover: "cell"` reacts to hovering the enclosing `group/media` cell, whose own
 * overlay button takes the click (PostMediaPreview).
 */
export function playMarkClass(hover: "self" | "cell") {
  return cn(
    "absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm transition-all duration-150",
    hover === "self"
      ? "hover:scale-110 hover:bg-black/70"
      : "group-hover/media:scale-110 group-hover/media:bg-black/70",
  );
}

export function PlayMarkIcon() {
  return <Play className="ml-0.5 h-5 w-5 text-white" fill="white" style={{ filter: "none" }} />;
}
