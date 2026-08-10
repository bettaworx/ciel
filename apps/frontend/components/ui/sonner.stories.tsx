import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { toast } from "sonner";
import { ThemeProvider } from "next-themes";
import { Button } from "./button";
import { Toaster } from "./sonner";

const meta = {
  title: "UI/Sonner",
  component: Toaster,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <Story />
        <Toaster />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast("Event has been created")}>
        Show Toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Success", { description: "Operation completed." })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Error", { description: "Something went wrong." })
        }
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.info("Heads up", { description: "Something worth knowing." })
        }
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("Careful", { description: "This needs attention." })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast("Event created", {
            description: "Monday, January 3rd at 6:00pm",
            action: { label: "Undo", onClick: () => {} },
          })
        }
      >
        With Action
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Upload failed", {
            description:
              "The file could not be processed because the server rejected it. Try a smaller image, or check your connection and attempt the upload again.",
          })
        }
      >
        Long Description
      </Button>
    </div>
  ),
};

export const ToastTest: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast("Test notification")}
    >
      Trigger Toast
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Trigger Toast" }));
    // Give toast time to appear
    await new Promise((r) => setTimeout(r, 500));
    const body = within(document.body);
    await expect(body.getByText("Test notification")).toBeInTheDocument();
  },
};
