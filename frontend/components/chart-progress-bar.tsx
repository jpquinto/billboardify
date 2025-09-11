"use client";

import { useEffect, useState } from "react";
import { LiquidGlassContainer } from "./ui/liquid-glass-container";
import { cn } from "@/lib/utils";

export const ChartProgressBar = () => {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = Math.min(
        100,
        Math.max(0, (scrollTop / docHeight) * 100)
      );

      setScrollPercent(scrollPercentage);
    };

    window.addEventListener("scroll", handleScroll);
    setIsLoaded(true);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sections = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

  if (!isLoaded) return null;

  // Determine active section based on scroll percentage
  const activeSection = Math.ceil(scrollPercent / 10) || 1; // 1-10%, 11-20%, etc.

  return (
    <div className="fixed top-1/2 right-0 -translate-y-1/2 z-50 p-4">
      <div className="flex flex-col w-12 gap-y-[20px] items-end">
        {sections.map((section) => {
          const sectionNum = parseInt(section);
          const distance = Math.abs(activeSection - sectionNum);

          let widthValue = 8; // w-2 equivalent (8px)
          let opacityValue = 0.6;
          let bgColor = "bg-pink-400/10";

          if (distance === 0) {
            widthValue = 72; // w-18 equivalent (72px)
            opacityValue = 1;
            bgColor =
              "bg-gradient-to-br from-purple-700 via-pink-400 to-amber-400";
          } else if (distance === 1) {
            widthValue = 40; // w-10 equivalent (40px)
            opacityValue = 0.8;
            bgColor =
              "bg-gradient-to-br from-purple-700/50 via-pink-400/50 to-amber-400/50";
          } else if (distance === 2) {
            widthValue = 24; // w-6 equivalent (24px)
            opacityValue = 0.7;
            bgColor =
              "bg-gradient-to-br from-purple-700/20 via-pink-400/20 to-amber-400/20";
          }

          return (
            <div key={section} className="relative h-[6px]">
              <div
                className={cn(
                  "h-2 transition-all duration-500 ease-in-out rounded-full flex items-end justify-end backdrop-blur-sm border p-2 text-white relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-90 after:pointer-events-none border-white",
                  bgColor
                )}
                style={{
                  width: `${widthValue}px`,
                  opacity: opacityValue,
                }}
              >
                <div
                  className={cn(
                    "transition-all rounded-full flex items-end justify-end w-full"
                  )}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
