import React from "react";
import { notFound } from "next/navigation";
import { DynamicTitle } from "@/components/DynamicTitle";
import { isFollowTab } from "@/lib/follow-tabs";
import { UserFollowListContent } from "./UserFollowListContent";

type PageProps = {
  params: Promise<{ username: string; tab: string }>;
};

export default function UserFollowListPage({ params }: PageProps) {
  const { username, tab } = React.use(params);

  if (!isFollowTab(tab)) notFound();

  return (
    <>
      <DynamicTitle title={`@${username}`} />
      <UserFollowListContent username={username} tab={tab} />
    </>
  );
}
