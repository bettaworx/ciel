import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { AlertCircle, Terminal } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";

const meta = {
  title: "UI/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <Terminal className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Notice</AlertTitle>
    </Alert>
  ),
};

export const NoIcon: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Update available</AlertTitle>
      <AlertDescription>
        A new software update is available for download.
      </AlertDescription>
    </Alert>
  ),
};

export const RoleTest: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Accessible alert</AlertTitle>
      <AlertDescription>This alert has the correct role.</AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toBeInTheDocument();
  },
};
