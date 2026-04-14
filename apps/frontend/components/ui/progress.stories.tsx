import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./progress";

const meta = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 50,
    className: "w-[300px]",
  },
};

export const Empty: Story = {
  args: {
    value: 0,
    className: "w-[300px]",
  },
};

export const Quarter: Story = {
  args: {
    value: 25,
    className: "w-[300px]",
  },
};

export const Half: Story = {
  args: {
    value: 50,
    className: "w-[300px]",
  },
};

export const ThreeQuarters: Story = {
  args: {
    value: 75,
    className: "w-[300px]",
  },
};

export const Full: Story = {
  args: {
    value: 100,
    className: "w-[300px]",
  },
};

export const AllValues: Story = {
  render: () => (
    <div className="flex w-[300px] flex-col gap-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">0%</p>
        <Progress value={0} />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">25%</p>
        <Progress value={25} />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">50%</p>
        <Progress value={50} />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">75%</p>
        <Progress value={75} />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">100%</p>
        <Progress value={100} />
      </div>
    </div>
  ),
};
