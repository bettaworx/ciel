import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarActionBaseProps {
  icon: ReactNode;
  label: ReactNode;
  subLabel?: ReactNode;
  trailingIcon?: ReactNode;
  isExpanded: boolean;
  canAnimate?: boolean;
  hoverBg?: string;
  buttonVariant?: "sidebar" | "sidebar_primary";
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
  trailingIcon,
  isExpanded,
  canAnimate = true,
  hoverBg,
  buttonVariant = "sidebar",
  className,
  iconPaddingClassName,
  ...props
}: SidebarActionButtonProps | SidebarActionLinkProps) {
  const iconWrapperClasses = iconPaddingClassName ?? "w-[48px] h-[48px]";
  const classes = cn(
    buttonVariants({ variant: buttonVariant, size: "sidebar" }),
    "h-[48px] w-full self-start justify-start gap-[6px] [&_svg]:size-4",
    hoverBg,
    className,
  );

  const content = (
    <>
      <div
        className={cn(
          "w-[48px] h-[48px] flex items-center justify-center shrink-0",
          iconWrapperClasses,
        )}
      >
        {icon}
      </div>
      <motion.div
        animate={{
          width: isExpanded ? 170 : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={canAnimate ? { duration: 0.2, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }}
        className={cn("overflow-hidden whitespace-nowrap flex items-center", trailingIcon && "pr-4")}
        style={{ pointerEvents: isExpanded ? "auto" : "none", flexShrink: 0 }}
      >
        <div
          className={cn(
            "flex min-w-0 flex-col text-left grow",
            !trailingIcon && "pr-4",
          )}
        >
          <span className="text-sm font-medium leading-tight truncate">
            {label}
          </span>
          {subLabel && (
            <span className="text-xs text-muted-foreground leading-tight truncate">
              {subLabel}
            </span>
          )}
        </div>
        {trailingIcon && (
          <div className="shrink-0 ml-2 text-muted-foreground">
            {trailingIcon}
          </div>
        )}
      </motion.div>
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
