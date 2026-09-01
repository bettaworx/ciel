import type { MfmHashtag as MfmHashtagType } from "mfm-js";
import Link from "next/link";
import { searchUrl } from "@/lib/search-tabs";

interface MfmHashtagProps {
  node: MfmHashtagType;
}

/**
 * Renders an MFM `#tag` hashtag as a link to tag search (posts tab).
 *
 * Click duplication with a surrounding "click body → open detail" link is
 * avoided structurally by the caller (PostCard places that overlay link as a
 * sibling of the rendered content, so clicks on this anchor do not bubble
 * through it).
 */
export function MfmHashtag({ node }: MfmHashtagProps) {
  const hashtag = node.props.hashtag;

  if (!hashtag) {
    return <span className="mfm-hashtag">#</span>;
  }

  return (
    <Link
      href={searchUrl(`#${hashtag}`, "posts")}
      className="mfm-hashtag hover:underline"
    >
      #{hashtag}
    </Link>
  );
}
