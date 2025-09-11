"use client";

import MediaPlayer from "./media-player";

export const ControlBar = () => {
  return (
    <header className="bottom-0 fixed w-[100dvw] transition-colors duration-500 z-[999]">
      <MediaPlayer />
    </header>
  );
};
