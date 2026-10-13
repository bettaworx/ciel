import { createFileRoute } from "@tanstack/react-router";
import { DynamicTitle } from "@/components/DynamicTitle";
import { UserProfileContent } from "@/components/users/UserProfileContent";

export const Route = createFileRoute("/users/$username/")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();

  return (
    <>
      <DynamicTitle title={`@${username}`} />
      <UserProfileContent username={username} />
    </>
  );
}
