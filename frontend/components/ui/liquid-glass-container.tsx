import { cn } from "@/lib/utils";

export const LiquidGlassContainer = ({
  children,
  className,
  innerClassName,
  innerStyle,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  innerStyle?: any;
}) => {
  return (
    <div
      className={cn(
        "mx-auto w-full flex items-center justify-center rounded-xl",
        className
      )}
      style={innerStyle}
    >
      <div
        className={cn(
          "flex gap-2 bg-black/5 backdrop-blur-sm border border-white/60 rounded-xl shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] p-2 text-white relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-90 after:pointer-events-none",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};
