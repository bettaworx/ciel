import type { Meta, StoryObj } from "@storybook/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { CheckCheck } from "lucide-react";
import { type ReactNode, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { PageContainer } from "@/components/PageContainer";
import { PullToRefresh } from "@/components/PullToRefresh";
import { PageHeader } from "@/components/shared/PageHeader";
import { StickyPageToolbar } from "@/components/shared/StickyPageToolbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initI18n } from "@/i18n";
import { useTranslations } from "@/lib/i18n";
import messages from "@/messages/ja.json";

function StoryRouter({ children }: { children: ReactNode }) {
  const [router] = useState(() =>
    createRouter({
      history: createMemoryHistory({ initialEntries: ["/"] }),
      routeTree: createRootRoute({ component: () => children }),
    }),
  );
  return <RouterProvider router={router} />;
}

type ExampleProps = { header: boolean; action: boolean; pullToRefresh: boolean };

const rows = Array.from({ length: 20 }, (_, index) => index + 1);

function Example({ header, action, pullToRefresh }: ExampleProps) {
  const t = useTranslations();
  const [read, setRead] = useState(false);
  const tabs = (
    <>
      {!action && (
        <div className={header ? "mb-3 h-40 rounded-2xl bg-card" : "h-40 rounded-2xl bg-card"} />
      )}
      <Tabs defaultValue="first">
        <StickyPageToolbar>
          <div className="flex items-center gap-2">
            <TabsList className="flex-1">
              <TabsTrigger value="first">{t("notifications.tabs.all")}</TabsTrigger>
              <TabsTrigger value="second">{t("notifications.tabs.mentions")}</TabsTrigger>
            </TabsList>
            {action && (
              <Button
                className="h-12 w-12 shrink-0 rounded-2xl bg-card hover:bg-card-hover"
                variant="ghost"
                aria-label={t("notifications.markAllRead")}
                disabled={read}
                onClick={() => setRead(true)}
              >
                <CheckCheck className="h-5 w-5" />
              </Button>
            )}
          </div>
        </StickyPageToolbar>
        {["first", "second"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <div className="overflow-hidden rounded-xl bg-card sm:rounded-2xl">
              {rows.map((row) => (
                <div key={row} className="h-24 border-b border-border p-3">
                  {row}
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );

  return (
    <div data-testid="scroll-area" className="h-[420px] overflow-auto bg-background">
      <PageContainer
        maxWidth="2xl"
        header={
          header ? (
            <PageHeader showBackButton={false}>{t("notifications.title")}</PageHeader>
          ) : undefined
        }
      >
        {pullToRefresh ? <PullToRefresh onRefresh={async () => {}}>{tabs}</PullToRefresh> : tabs}
      </PageContainer>
    </div>
  );
}

const meta = {
  title: "Shared/StickyPageToolbar",
  component: Example,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <StoryRouter>
        <Story />
      </StoryRouter>
    ),
  ],
  loaders: [
    async () => {
      await initI18n("ja", messages);
      return {};
    },
  ],
  args: { header: false, action: false, pullToRefresh: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const scroller = canvas.getByTestId("scroll-area");
    const tablist = canvas.getByRole("tablist");
    const panel = canvas.getByRole("tabpanel");
    const panelTop = panel.getBoundingClientRect().top;
    await expect(panelTop - tablist.getBoundingClientRect().bottom).toBe(12);
    const header = canvasElement.querySelector<HTMLElement>('[data-slot="page-header"]');
    if (header) {
      await waitFor(() => {
        expect(getComputedStyle(header).backgroundImage.includes("linear-gradient")).toBe(
          !args.action,
        );
      });
    }

    scroller.scrollTop = 300;
    await waitFor(() => {
      expect(tablist.getBoundingClientRect().top - scroller.getBoundingClientRect().top).toBe(
        args.header ? 64 : 12,
      );
      // Sticky controls retain their original space without moving the list.
      expect(panel.getBoundingClientRect().top + scroller.scrollTop).toBe(panelTop);
      if (header) expect(getComputedStyle(header).backgroundImage).toBe("none");
    });

    await userEvent.click(canvas.getByRole("tab", { name: messages.notifications.tabs.mentions }));
    await expect(
      canvas.getByRole("tab", { name: messages.notifications.tabs.mentions }),
    ).toHaveAttribute("aria-selected", "true");
    if (args.action) {
      const button = canvas.getByRole("button", { name: messages.notifications.markAllRead });
      await expect(button.getBoundingClientRect().top).toBe(tablist.getBoundingClientRect().top);
      await userEvent.click(button);
      await expect(button).toBeDisabled();
    }

    scroller.scrollTop = 0;
    await waitFor(() => {
      expect(
        canvas.getByRole("tabpanel").getBoundingClientRect().top -
          tablist.getBoundingClientRect().bottom,
      ).toBe(12);
      if (header) {
        expect(getComputedStyle(header).backgroundImage.includes("linear-gradient")).toBe(
          !args.action,
        );
      }
    });
  },
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithoutHeader: Story = {};
export const WithHeader: Story = { args: { header: true } };
export const Notifications: Story = { args: { header: true, action: true } };
export const InsidePullToRefresh: Story = { args: { header: true, pullToRefresh: true } };
