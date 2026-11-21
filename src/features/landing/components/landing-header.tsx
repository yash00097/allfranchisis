"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { landingFont } from "@/features/landing/components/font";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const TEXT_LINK =
  "button-sm px-3 py-2 text-landing-muted transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-landing-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const PANEL_LINK =
  "heading-4 block py-2 text-landing-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

// 60ms per item, capped so the whole sequence stays under 400ms.
const stagger = (index: number) => ({
  transitionDelay: `${Math.min(index * 60, 400)}ms`,
});

function Logo() {
  return (
    <Link
      href="/collections"
      prefetch
      className="flex items-center gap-2 px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Image src="/logo.svg" alt="" aria-hidden="true" width={24} height={24} />
      <span className="title-3 text-landing-fg">
        <span className="text-primary">All</span>Franchisis
      </span>
    </Link>
  );
}

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const { style } = document.documentElement;
    style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const panelItem = cn(
    "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0",
    open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
  );

  return (
    <div className={landingFont.className}>
      <header className="fixed inset-x-4 top-3 z-50 mx-auto flex max-w-fit items-center gap-2 border border-landing-line bg-landing-surface/70 px-2 py-2 backdrop-blur-xl max-sm:max-w-none max-sm:justify-between">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/collections" prefetch className={TEXT_LINK}>
              Collections
            </Link>
            <Show when="signed-in">
              <Link href="/watching" className={TEXT_LINK}>
                In Progress
              </Link>
              <Link href="/watched" className={TEXT_LINK}>
                Completed
              </Link>
            </Show>
          </div>
          <ThemeToggle />
          <div className="hidden items-center gap-1 sm:flex">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button type="button" className={TEXT_LINK}>
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="button-sm border border-landing-line bg-landing-bg px-3 py-2 text-landing-fg transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-landing-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]"
                >
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            className="relative flex size-10 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:hidden"
          >
            {[
              open ? "translate-y-0 rotate-45" : "-translate-y-1",
              open ? "translate-y-0 -rotate-45" : "translate-y-1",
            ].map((state) => (
              <span
                key={state}
                aria-hidden="true"
                className={cn(
                  "absolute h-0.5 w-5 bg-landing-fg transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  state,
                )}
              />
            ))}
          </button>
        </nav>
      </header>

      <div
        id="landing-menu"
        inert={!open}
        className={cn(
          "fixed inset-0 z-40 bg-landing-bg/95 px-4 pt-24 pb-8 backdrop-blur-2xl transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col gap-2">
          <Link
            href="/collections"
            onClick={close}
            className={cn(PANEL_LINK, panelItem)}
            style={stagger(0)}
          >
            Collections
          </Link>
          <Show when="signed-in">
            <Link
              href="/watching"
              onClick={close}
              className={cn(PANEL_LINK, panelItem)}
              style={stagger(1)}
            >
              In Progress
            </Link>
            <Link
              href="/watched"
              onClick={close}
              className={cn(PANEL_LINK, panelItem)}
              style={stagger(2)}
            >
              Completed
            </Link>
            <div className={cn("pt-4", panelItem)} style={stagger(3)}>
              <UserButton />
            </div>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className={cn(PANEL_LINK, panelItem, "text-left")}
                style={stagger(1)}
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className={cn(PANEL_LINK, panelItem, "text-left")}
                style={stagger(2)}
              >
                Sign up
              </button>
            </SignUpButton>
          </Show>
        </nav>
      </div>
    </div>
  );
}
