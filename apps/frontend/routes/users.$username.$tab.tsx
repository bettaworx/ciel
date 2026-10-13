import { createFileRoute, notFound } from "@tanstack/react-router";
import { DynamicTitle } from "@/components/DynamicTitle";
import { isFollowTab } from "@/lib/follow-tabs";
import { UserFollowListContent } from "@/components/users/UserFollowListContent";

export const Route = createFileRoute("/users/$username/$tab")({
  // Rejected before the component renders, so an unknown tab is a 404 rather
  // than a profile page with an empty list.
  beforeLoad: ({ params }) => {
    if (!isFollowTab(params.tab)) throw notFound();
  },
  component: UserFollowListPage,
});

function UserFollowListPage() {
  const { username, tab } = Route.useParams();

  if (!isFollowTab(tab)) throw notFound();

  return (
    <>
      <DynamicTitle title={`@${username}`} />
      <UserFollowListContent username={username} tab={tab} />
    </>
  );
}
