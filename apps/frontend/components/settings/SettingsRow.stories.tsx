import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { KeyRound, Languages, Lock, Palette, Trash2, UserPen } from "lucide-react";
import {
  SettingsRow,
  SettingsRowGroup,
  SettingsSelectRow,
  SettingsSwitchRow,
} from "./SettingsRow";

const meta = {
  title: "Settings/SettingsRow",
  component: SettingsRow,
  tags: ["autodocs"],
} satisfies Meta<typeof SettingsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The three shapes a row takes, in one card. */
export const Group: Story = {
  args: { label: "" },
  render: () => (
    <div className="max-w-lg">
      <SettingsRowGroup>
        <SettingsRow
          icon={UserPen}
          label="ユーザー名を変更"
          href="/settings/account/username"
        />
        <SettingsRow icon={KeyRound} label="パスワード" href="/settings/security/password" />
        <SettingsRow label="ミュートとブロック" href="/settings/mutes" />
        <SettingsRow
          icon={Trash2}
          label="アカウントを削除"
          href="/settings/account/delete"
          className="text-destructive"
        />
      </SettingsRowGroup>
    </div>
  ),
};

function SelectRows() {
  const [locale, setLocale] = useState("ja");
  const [theme, setTheme] = useState("system");
  const [isPrivate, setIsPrivate] = useState(false);

  return (
    <div className="max-w-lg">
      <SettingsRowGroup>
        <SettingsSwitchRow
          icon={Lock}
          label="非公開アカウントにする"
          checked={isPrivate}
          onCheckedChange={setIsPrivate}
        />
        <SettingsSelectRow
          icon={Languages}
          label="言語"
          value={locale}
          options={[
            { value: "ja", label: "日本語" },
            { value: "en", label: "English" },
          ]}
          onValueChange={setLocale}
        />
        <SettingsSelectRow
          icon={Palette}
          label="テーマ"
          value={theme}
          options={[
            { value: "light", label: "ライト" },
            { value: "dark", label: "ダーク" },
            { value: "system", label: "システム" },
          ]}
          onValueChange={setTheme}
        />
      </SettingsRowGroup>
    </div>
  );
}

/** Picking a value updates the row's trailing label. */
export const Select: Story = {
  args: { label: "" },
  render: () => <SelectRows />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: /テーマ/ }));
    // Desktop opens a DropdownMenu, touch opens a Drawer — both render the
    // options into a portal outside canvasElement.
    const options = within(document.body);
    await userEvent.click(await options.findByText("ダーク"));

    await expect(
      canvas.getByRole("button", { name: /テーマ/ }),
    ).toHaveTextContent("ダーク");
  },
};
