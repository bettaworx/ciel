import { createFileRoute } from "@tanstack/react-router";
import { DynamicTitle } from "@/components/DynamicTitle";
import { HomePage } from "@/components/HomePage";

export const Route = createFileRoute("/")({
  component: HomePageRoute,
});

function HomePageRoute() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.home" />
      <HomePage />
    </>
  );
}
