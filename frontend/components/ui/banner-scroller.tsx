"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ImageTransition } from "./image-transition";

interface BannerProps {
  src: string;
  alt: string;
  opacity?: number;
  blur?: number;
  gradientTransparent?: number; // percentage for transparent center
  className?: string;
}

const Banner: React.FC<BannerProps> = ({ src, alt, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={1920}
        height={400}
        className="max-w-[100rem] object-cover -z-10 block"
      />
    </div>
  );
};

export const BannerScroller = ({ banners }: { banners: string[] }) => {
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
        style={{ filter: `blur(1.5px)` }}
      >
        {/* First Banner */}
        <Banner src={banners[0]} alt="Artist Banner 1" />

        {/* Transition between first and third banner */}
        <ImageTransition
          image1={banners[0]}
          image2={banners[1]}
          transitionHeight={250}
          className="scale-y-[1.02] -z-10 max-w-[100rem] block"
        />

        <Banner src={banners[1]} alt="Artist Banner 3" />

        <ImageTransition
          image1={banners[1]}
          image2={banners[2]}
          transitionHeight={250}
          className="scale-y-[1.02] -z-10 max-w-[100rem] block"
        />

        {/* Second Banner */}
        <Banner src={banners[2]} alt="Artist Banner 2" />
      </div>
    </div>
  );
};
