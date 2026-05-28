import React from "react";
import { DynamicTitle } from "@/components/DynamicTitle";
import { PostDetailContent } from "./PostDetailContent";

type PageProps = {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ expandAncestors?: string }>;
};

export default function PostDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = React.use(params);
  const resolvedSearch = React.use(searchParams);
  const expandAncestors = resolvedSearch.expandAncestors === "1";

  return (
    <>
      <DynamicTitle titleKey="meta.pages.postDetail" />
      <PostDetailContent postId={resolvedParams.postId} expandAncestors={expandAncestors} />
    </>
  );
}
