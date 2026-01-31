import { DynamicTitle } from "@/components/DynamicTitle";
import { HomePage } from "./HomePage";

export default function HomePageRoute() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.home" />
      <HomePage />
    </>
  );
}
