import React, { useState, useEffect, useRef } from "react";

interface ImageGradientTransitionProps {
  imageUrl: string;
  gradientWidth?: number;
  className?: string;
  alt?: string;
  onTransitionComplete?: (transitionImageUrl: string) => void;
  onError?: (error: Error) => void;
}

export const ImageGradientTransition: React.FC<
  ImageGradientTransitionProps
> = ({
  imageUrl,
  gradientWidth = 100,
  className = "",
  alt = "Image with gradient transition",
  onTransitionComplete,
  onError,
}) => {
  const [transitionImageUrl, setTransitionImageUrl] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isCancelled = false;

    const createGradientTransition = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create a new image element
        const img = new Image();
        img.crossOrigin = "anonymous"; // Enable cross-origin if needed

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = imageUrl;
        });

        if (isCancelled) return;

        // Create canvas with extended width for gradients
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        // Set canvas dimensions (original width + 2 * gradient width)
        canvas.width = img.width + gradientWidth * 2;
        canvas.height = img.height;

        // Draw the original image in the center
        ctx.drawImage(img, gradientWidth, 0);

        // Get the leftmost and rightmost columns of pixels
        const leftPixelData = ctx.getImageData(gradientWidth, 0, 1, img.height);
        const rightPixelData = ctx.getImageData(
          gradientWidth + img.width - 1,
          0,
          1,
          img.height
        );

        // Create left gradient
        for (let x = 0; x < gradientWidth; x++) {
          const alpha = x / gradientWidth; // 0 to 1

          for (let y = 0; y < img.height; y++) {
            const pixelIndex = y * 4; // RGBA
            const r = leftPixelData.data[pixelIndex];
            const g = leftPixelData.data[pixelIndex + 1];
            const b = leftPixelData.data[pixelIndex + 2];

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }

        // Create right gradient
        for (let x = 0; x < gradientWidth; x++) {
          const alpha = (gradientWidth - x) / gradientWidth; // 1 to 0

          for (let y = 0; y < img.height; y++) {
            const pixelIndex = y * 4; // RGBA
            const r = rightPixelData.data[pixelIndex];
            const g = rightPixelData.data[pixelIndex + 1];
            const b = rightPixelData.data[pixelIndex + 2];

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.fillRect(gradientWidth + img.width + x, y, 1, 1);
          }
        }

        // Convert canvas to data URL
        const transitionUrl = canvas.toDataURL("image/png");

        if (!isCancelled) {
          setTransitionImageUrl(transitionUrl);
          onTransitionComplete?.(transitionUrl);
        }
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Gradient transition generation failed");
        if (!isCancelled) {
          setError(error);
          onError?.(error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    createGradientTransition();

    return () => {
      isCancelled = true;
    };
  }, [imageUrl, gradientWidth, onTransitionComplete, onError]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        <div className="text-gray-500">Generating gradient transition...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-100 text-red-600 ${className}`}
      >
        <div>Error: {error.message}</div>
      </div>
    );
  }

  return transitionImageUrl ? (
    <div>
      <img src={transitionImageUrl} alt={alt} className={className} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  ) : null;
};
