"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingHeader() {
  return (
    <header className="relative z-20 flex h-16 items-center justify-between px-6">
      <a className="flex items-center gap-2 font-semibold" href="/collections">
        <Image
          src="/logo.svg"
          alt=""
          aria-hidden="true"
          width={28}
          height={28}
        />
        <span className="inline-flex">
          <span className="text-primary">All</span>
          <span>Franchisis</span>
        </span>
      </a>
      <nav className="flex items-center gap-4 text-sm">
        <a href="/collections">Collections</a>
        <ThemeToggle />
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button type="button">Sign in</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button">Sign up</button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <a href="/watching">In Progress</a>
          <a href="/watched">Completed</a>
          <UserButton />
        </Show>
      </nav>
    </header>
  );
}
