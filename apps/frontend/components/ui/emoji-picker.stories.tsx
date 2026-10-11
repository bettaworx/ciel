import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/use-queries";
import {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
} from "./emoji-picker";

const meta = {
  title: "UI/EmojiPicker",
  component: EmojiPicker,
  tags: ["autodocs"],
  // The picker loads emoji data through react-query. Custom emojis come from the
  // API, so seed an empty list instead of hitting a backend Storybook doesn't have.
  decorators: [
    (Story) => {
      const client = new QueryClient();
      client.setQueryData(queryKeys.customEmojis, []);
      return (
        <QueryClientProvider client={client}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof EmojiPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: null,
    onEmojiSelect: (e) => console.log("selected", e),
  },
  render: (args) => (
    <div className="w-[352px] h-[400px]">
      <EmojiPicker {...args}>
        <EmojiPickerSearch placeholder="Search emoji..." />
        <EmojiPickerContent />
        <EmojiPickerFooter />
      </EmojiPicker>
    </div>
  ),
};

export const WithoutFooter: Story = {
  args: {
    children: null,
    onEmojiSelect: (e) => console.log("selected", e),
  },
  render: (args) => (
    <div className="w-[352px] h-[350px]">
      <EmojiPicker {...args}>
        <EmojiPickerSearch placeholder="Search emoji..." />
        <EmojiPickerContent />
      </EmojiPicker>
    </div>
  ),
};

export const WideColumns: Story = {
  args: {
    children: null,
    columns: 12,
    onEmojiSelect: (e) => console.log("selected", e),
  },
  render: (args) => (
    <div className="w-[480px] h-[400px]">
      <EmojiPicker {...args}>
        <EmojiPickerSearch placeholder="Search emoji..." />
        <EmojiPickerContent />
        <EmojiPickerFooter />
      </EmojiPicker>
    </div>
  ),
};
