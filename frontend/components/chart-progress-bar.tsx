"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ChartProgressBarProps {
  gradient1: string;
  gradient2: string;
  gradient3: string;
  defaultBackground: string;
}

export const ChartProgressBar = ({
  gradient1,
  gradient2,
  gradient3,
  defaultBackground,
}: ChartProgressBarProps) => {
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
          let bgColor = defaultBackground;

          if (distance === 0) {
            widthValue = 72; // w-18 equivalent (72px)
            opacityValue = 1;
            bgColor = gradient1;
          } else if (distance === 1) {
            widthValue = 40; // w-10 equivalent (40px)
            opacityValue = 0.8;
            bgColor = gradient2;
          } else if (distance === 2) {
            widthValue = 24; // w-6 equivalent (24px)
            opacityValue = 0.7;
            bgColor = gradient3;
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
