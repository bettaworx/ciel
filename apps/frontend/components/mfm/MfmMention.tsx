import type { MfmMention as MfmMentionType } from "mfm-js";
import Link from "next/link";

interface MfmMentionProps {
  node: MfmMentionType;
}

/**
 * Renders an MFM `@user` mention.
 *
 * Local mentions become a link to `/users/{username}`. Federated mentions
 * (host present) and malformed nodes fall back to plain text since this app
 * does not expose a federated profile route.
 *
 * Click duplication with a surrounding "click body → open detail" link is
 * avoided structurally by the caller (PostCard places that overlay link as a
 * sibling of the rendered content, so clicks on this anchor do not bubble
 * through it).
 */
export function MfmMention({ node }: MfmMentionProps) {
  const { username, host, acct } = node.props;

  if (!username || host) {
    return <span className="mfm-mention">{acct}</span>;
  }

  return (
    <Link href={`/users/${username}`} className="mfm-mention hover:underline">
      {acct}
    </Link>
  );
}
