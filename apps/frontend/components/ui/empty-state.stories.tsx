import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Inbox, Search, FileX } from "lucide-react";
import { EmptyState } from "./empty-state";

const meta = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "No items found",
    description: "There are no items to display at this time.",
  },
};

export const WithIcon: Story = {
  args: {
    icon: Inbox,
    title: "No messages",
    description: "Your inbox is empty. New messages will appear here.",
  },
};

export const WithAction: Story = {
  args: {
    icon: Search,
    title: "No results",
    description: "Try adjusting your search or filter to find what you're looking for.",
    action: {
      label: "Clear filters",
      onClick: fn(),
    },
  },
};

export const NoDescription: Story = {
  args: {
    icon: FileX,
    title: "No files uploaded",
  },
};

export const ActionClickTest: Story = {
  args: {
    icon: Inbox,
    title: "No posts yet",
    description: "Be the first to post something!",
    action: {
      label: "Create post",
      onClick: fn(),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Create post" }));
    await expect(args.action!.onClick).toHaveBeenCalledOnce();
  },
};
