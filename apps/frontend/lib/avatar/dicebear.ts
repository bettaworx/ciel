import { Avatar, Style } from "@dicebear/core";
import glyphs from "@dicebear/styles/glyphs.json";

const style = new Style(glyphs);

export function generateAvatar(seed: string): {
  svg: string;
  dataUri: string;
} {
  const avatar = new Avatar(style, { seed });
  return { svg: avatar.toString(), dataUri: avatar.toDataUri() };
}
