"use client";

import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 bg-background/85 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <Separator orientation="vertical" className="h-5 md:hidden" />
        <Link
          href="/collections"
          className="flex items-center gap-2 font-semibold md:hidden"
        >
          <Image
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
          />
          <span className="inline-flex">
            <span className="text-primary">All</span>
            <span>Franchisis</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
