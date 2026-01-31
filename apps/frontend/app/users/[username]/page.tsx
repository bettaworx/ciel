import React from "react";
import { DynamicTitle } from "@/components/DynamicTitle";
import { UserProfileContent } from "./UserProfileContent";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default function UserProfilePage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const username = resolvedParams.username;

  return (
    <>
      <DynamicTitle title={`@${username}`} />
      <UserProfileContent username={username} />
    </>
  );
}
