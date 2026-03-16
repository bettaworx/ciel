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
  render: () => (
    <div className="w-[352px] h-[400px]">
      <EmojiPicker>
        <EmojiPickerSearch placeholder="Search emoji..." />
        <EmojiPickerContent />
        <EmojiPickerFooter />
      </EmojiPicker>
    </div>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <div className="w-[352px] h-[350px]">
      <EmojiPicker>
        <EmojiPickerSearch placeholder="Search emoji..." />
        <EmojiPickerContent />
      </EmojiPicker>
    </div>
  ),
};
