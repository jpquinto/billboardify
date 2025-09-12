"use client";

import { useEffect, useState } from "react";
import { ImageTransition } from "./image-transition";
import { ImageGradientTransition } from "./image-gradient";

interface GradientBannerProps {
  src: string;
  alt: string;
  gradientWidth?: number;
  className?: string;
  onGradientImageReady?: (imageUrl: string) => void;
}

const GradientBanner: React.FC<GradientBannerProps> = ({
  src,
  alt,
  gradientWidth = 100,
  className = "",
  onGradientImageReady,
}) => {
  return (
    <div className={`relative ${className}`}>
      <ImageGradientTransition
        imageUrl={src}
        alt={alt}
        gradientWidth={gradientWidth}
        className="max-w-[70rem] max-h-[10rem] object-cover -z-10 block"
        onTransitionComplete={onGradientImageReady}
      />
    </div>
  );
};

export const GradientBannerScroller = ({
  banners,
  gradientWidth = 100,
}: {
  banners: string[];
  gradientWidth?: number;
}) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className="fixed top-[50%] left-0 w-full flex items-start justify-center"
      style={{ transform: `translateY(${scrollY * -0.27 - 70}px)` }}
    >
      <div
        className="absolute inset-0 z-10 w-full h-full scale-x-[1.02]"
        style={{
          background: `linear-gradient(to right, rgba(255,255,255,1) 0%, transparent ${50}%, transparent ${
            100 - 50
          }%, rgba(255,255,255,1) 100%)`,
        }}
      />
      <div
        className="flex flex-col items-center leading-none opacity-50"
        // style={{ filter: `blur(1.5px)` }}
      >
        {banners.map((banner, index) => (
          <div key={index}>
            <GradientBanner
              src={banner}
              alt={`Artist Banner ${index + 1}`}
              gradientWidth={gradientWidth}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
