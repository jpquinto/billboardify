"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Check if user has scrolled to the bottom
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        setActiveSection("contact");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll("section");
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.6,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <header className="top-0 fixed w-[100dvw] transition-colors duration-500 z-[999]">
      <div
        className={cn(
          "px-5 lg:px-8 h-20 flex items-center",
          scrolled && "bg-white"
        )}
      >
        <Link
          className="hidden md:flex items-center justify-center"
          href="#"
          role="button"
        >
          <Image
            src="/logo-png.png"
            alt="Logo"
            className="h-12 w-auto"
            width={260}
            height={260}
          />
        </Link>
        <nav className="mx-auto md:ml-auto md:mr-5 flex gap-4 sm:gap-6">
          {["welcome", "skills", "projects", "about", "blog", "contact"].map(
            (section) => (
              <Link
                key={section}
                className={cn(
                  "text-sm font-medium hover:underline underline-offset-4",
                  activeSection === section ? "underline" : ""
                )}
                href={`#${section}`}
              >
                {section}
              </Link>
            )
          )}
        </nav>
      </div>
      <div className="h-[100px] bg-gradient-to-b from-white to-transparent"></div>
    </header>
  );
};
