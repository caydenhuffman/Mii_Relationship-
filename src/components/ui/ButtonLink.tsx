import type { AnchorHTMLAttributes, PropsWithChildren } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { getButtonClassName, type ButtonVariant } from "@/components/ui/Button";

interface ButtonLinkProps
  extends Omit<LinkProps, "className">,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  variant?: ButtonVariant;
  className?: string;
}

export function ButtonLink({
  children,
  className = "",
  variant = "primary",
  ...props
}: PropsWithChildren<ButtonLinkProps>) {
  return (
    <Link className={getButtonClassName(variant, className)} {...props}>
      {children}
    </Link>
  );
}
