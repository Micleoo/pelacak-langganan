import * as React from "react";
import Link, { LinkProps } from "next/link";

export const Nav = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={`ds-nav ${className || ""}`.trim()}
        {...props}
      />
    );
  }
);
Nav.displayName = "Nav";

export interface NavLinkProps extends LinkProps {
  className?: string;
  isActive?: boolean;
  children: React.ReactNode;
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, isActive, ...props }, ref) => {
    let classes = "ds-nav-link";
    if (isActive) classes += " is-active";
    if (className) classes += ` ${className}`;

    return (
      <Link
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);
NavLink.displayName = "NavLink";
