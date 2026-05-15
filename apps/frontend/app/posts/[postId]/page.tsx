import React from "react";
import { DynamicTitle } from "@/components/DynamicTitle";
import { PostDetailContent } from "./PostDetailContent";

type PageProps = {
  params: Promise<{ postId: string }>;
};

export default function PostDetailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);

  return (
    <>
      <DynamicTitle titleKey="meta.pages.postDetail" />
      <PostDetailContent postId={resolvedParams.postId} />
    </>
  );
}
