"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SettingItemProps {
  title: string;
  description: string;
  children: React.ReactNode;
  /**
   * アライメント: 'center' (デフォルト) は単一行の入力要素向け、
   * 'start' は複数行の入力要素（ラジオボタン等）向け
   */
  align?: "center" | "start";
  /**
   * 追加の説明文 (children の下に表示)
   */
  helperText?: string;
}

export function SettingItem({
  title,
  description,
  children,
  align = "center",
  helperText,
}: SettingItemProps) {
  return (
    <Card>
      <CardContent
        className={cn(
          "flex flex-col md:flex-row md:justify-between gap-4 p-6",
          align === "center" ? "md:items-center" : "md:items-start",
        )}
      >
        <div className="flex-1">
          <h3 className="text-base font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          {helperText && (
            <p className="text-sm text-muted-foreground mt-2">{helperText}</p>
          )}
        </div>
        <div className="md:w-64 shrink-0">{children}</div>
      </CardContent>
    </Card>
  );
}
