import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DynamicTitle } from "@/components/DynamicTitle";
import { PostDetailContent } from "@/components/posts/PostDetailContent";

const searchSchema = z.object({
  /** "1" opens the thread with ancestors already expanded. */
  expandAncestors: z.string().optional(),
});

export const Route = createFileRoute("/posts/$postId")({
  validateSearch: searchSchema,
  component: PostDetailPage,
});

function PostDetailPage() {
  const { postId } = Route.useParams();
  const { expandAncestors } = Route.useSearch();

  return (
    <>
      <DynamicTitle titleKey="meta.pages.postDetail" />
      <PostDetailContent postId={postId} expandAncestors={expandAncestors === "1"} />
    </>
  );
}
