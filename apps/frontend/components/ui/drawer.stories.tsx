import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "./button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "./drawer";

const meta = {
  title: "UI/Drawer",
  component: Drawer,
  tags: ["autodocs"],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Profile</DrawerTitle>
          <DrawerDescription>
            Make changes to your profile. Click save when you&apos;re done.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Drawer body content goes here.
          </p>
        </div>
        <DrawerFooter>
          <Button>Save</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const Simple: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Confirmation</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to continue?
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button>Confirm</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const OpenTest: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer title</DrawerTitle>
          <DrawerDescription>Drawer description.</DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open Drawer" }));
    const body = within(document.body);
    await expect(body.getByText("Drawer title")).toBeInTheDocument();
  },
};

/**
 * A sheet taller than the viewport, with the keyboard inset faked so the story
 * shows what a focused form field does to it on a phone. The sheet should stop
 * short of the top, sit above the greyed keyboard band, and scroll internally —
 * the last field has to stay reachable. Setting `--keyboard-inset` to `0px`
 * returns it to the no-keyboard layout.
 */
export const TallWithKeyboard: Story = {
  render: () => (
    <div
      // Stands in for the software keyboard, which no desktop browser will
      // raise for us. KeyboardInset writes the same variable at runtime.
      style={{ ["--keyboard-inset" as string]: "300px" }}
    >
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex h-[300px] items-center justify-center bg-muted/80 text-sm text-muted-foreground">
        software keyboard (300px)
      </div>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Open Tall Drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Long form</DrawerTitle>
            <DrawerDescription>
              Twenty fields, more than fits above the keyboard.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 px-4 pb-4">
            {Array.from({ length: 20 }, (_, i) => (
              <input
                key={i}
                className="h-11 rounded-md border bg-background px-3"
                placeholder={`Field ${i + 1}`}
              />
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};
