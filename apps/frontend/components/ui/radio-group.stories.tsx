import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </div>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="a" className="flex gap-4">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="a" id="h1" />
        <Label htmlFor="h1">Option A</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="b" id="h2" />
        <Label htmlFor="h2">Option B</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="c" id="h3" />
        <Label htmlFor="h3">Option C</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="one" disabled>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="one" id="d1" />
        <Label htmlFor="d1">One</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="two" id="d2" />
        <Label htmlFor="d2">Two</Label>
      </div>
    </RadioGroup>
  ),
};

export const SelectionTest: Story = {
  render: () => (
    <RadioGroup defaultValue="first">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="first" id="t1" />
        <Label htmlFor="t1">First</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="second" id="t2" />
        <Label htmlFor="t2">Second</Label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const secondRadio = canvas.getByRole("radio", { name: "Second" });
    await userEvent.click(secondRadio);
    await expect(secondRadio).toBeChecked();
  },
};
