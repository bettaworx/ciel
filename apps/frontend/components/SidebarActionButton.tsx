import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarActionBaseProps {
  icon: ReactNode;
  label: ReactNode;
  subLabel?: ReactNode;
  isExpanded: boolean;
  hoverBg: string;
  className?: string;
  iconPaddingClassName?: string;
}

type SidebarActionLinkProps = SidebarActionBaseProps & {
  href: string;
};

type SidebarActionButtonProps = SidebarActionBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

export function SidebarActionButton({
  icon,
  label,
  subLabel,
  isExpanded,
  hoverBg,
  className,
  iconPaddingClassName,
  ...props
}: SidebarActionButtonProps | SidebarActionLinkProps) {
  const iconWrapperClasses = iconPaddingClassName ?? "w-[64px] h-[64px]";
  const classes = cn(
    buttonVariants({ variant: "sidebar", size: "sidebar" }),
    "h-[64px] [&_svg]:size-5",
    isExpanded
      ? "w-full min-w-[180px] self-start justify-start gap-2"
      : "w-[64px] aspect-square justify-center self-start gap-0",
    hoverBg,
    className,
  );

  const content = (
    <>
      <div
        className={cn(
          "w-[64px] h-[64px] flex items-center justify-center shrink-0",
          iconWrapperClasses,
        )}
      >
        {icon}
      </div>
      <div
        className={cn(
          "overflow-hidden whitespace-nowrap",
          isExpanded ? "block" : "hidden",
        )}
      >
        <div className="flex min-w-0 flex-col text-left pr-4">
          <span className="text-base font-medium leading-tight truncate">
            {label}
          </span>
          {subLabel && (
            <span className="text-sm text-muted-foreground leading-tight truncate">
              {subLabel}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (typeof props.href === "string") {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {content}
    </button>
  );
}
