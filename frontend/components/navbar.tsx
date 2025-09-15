"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;

      setScrolled(scrollTop > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const links = [
    {
      label: "songs",
      href: "/charts/hot-100",
      logo: "/song-chart-logo.png",
      logoText: "HOT 100",
      labelColor: "text-purple-700/50",
      topBarColor: "from-pink-400/70",
    },
    {
      label: "albums",
      href: "/charts/albums-50",
      logo: "/album-chart-logo.png",
      logoText: "ALBUMS 50",
      labelColor: "text-orange-400",
      topBarColor: "from-red-400/70",
    },
    {
      label: "artists",
      href: "/charts/artists-25",
      logo: "/artist-chart-logo.png",
      logoText: "ARTISTS 25",
      labelColor: "text-blue-800",
      topBarColor: "from-sky-700/70",
    },
  ];

  const logo = links.find((link) => pathname === link.href)?.logo;
  const logoText = links.find((link) => pathname === link.href)?.logoText;
  const labelColor =
    links.find((link) => pathname === link.href)?.labelColor || "text-gray-900";
  const topBarColor =
    links.find((link) => pathname === link.href)?.topBarColor ||
    "from-pink-400/70";

  const topBarOpacity = scrolled ? 0.4 : 0;
  const topBarHeight = scrolled ? "4px" : "0px";

  return (
    <header className="top-0 fixed w-[100dvw] transition-colors duration-500 z-[998]">
      <div
        className={cn("fixed flex w-full top-0 left-0 z-[999] transition-all")}
        style={{ opacity: topBarOpacity, height: topBarHeight }}
      >
        <div
          className={`flex w-full h-[${topBarHeight}] bg-gradient-to-b ${topBarColor} to-transparent`}
        ></div>
      </div>
      <div
        className={cn(
          "px-5 lg:px-8 h-20 flex items-center",
          scrolled && "bg-white"
        )}
      >
        <div
          className={cn(
            "hidden md:flex items-center justify-center transition-opacity duration-500",
            scrolled ? "opacity-100" : "opacity-0"
          )}
        >
          <Link
            className={cn(
              "hidden md:flex items-center justify-center transition-opacity duration-500",
              scrolled ? "opacity-100" : "opacity-0"
            )}
            href="/"
            role="button"
          >
            <Image
              src={logo || "/song-chart-logo.png"}
              alt="Logo"
              className="h-14 w-auto"
              width={260}
              height={260}
            />
          </Link>
          <p className="pl-3 font-bold tracking-tightest text-lg">{logoText}</p>
        </div>
        <nav className="mx-auto md:ml-auto md:mr-5 flex gap-4 sm:gap-6">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                className={cn(
                  "text-sm font-semibold tracking-tight hover:underline underline-offset-4",
                  isActive ? `${labelColor} underline` : "text-gray-500"
                )}
                href={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="h-[150px] bg-gradient-to-b from-white to-transparent"></div>
    </header>
  );
};
