import type { Meta, StoryObj } from "@storybook/react";
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
