import { createImageTransition } from "@/utils/image-transition";
import React, { useState, useEffect } from "react";

interface ImageTransitionProps {
  image1: string;
  image2: string;
  transitionHeight?: number;
  className?: string;
  alt?: string;
  onTransitionComplete?: (transitionImageUrl: string) => void;
  onError?: (error: Error) => void;
}

export const ImageTransition: React.FC<ImageTransitionProps> = ({
  image1,
  image2,
  transitionHeight = 250,
  className = "",
  alt = "Image transition",
  onTransitionComplete,
  onError,
}) => {
  const [transitionImageUrl, setTransitionImageUrl] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const generateTransition = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const transitionUrl = await createImageTransition(
          image1,
          image2,
          transitionHeight
        );

        if (!isCancelled) {
          setTransitionImageUrl(transitionUrl);
          onTransitionComplete?.(transitionUrl);
        }
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Transition generation failed");
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

    generateTransition();

    return () => {
      isCancelled = true;
    };
  }, [image1, image2, transitionHeight, onTransitionComplete, onError]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height: transitionHeight }}
      >
        <div className="text-gray-500">Generating transition...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-100 text-red-600 ${className}`}
        style={{ height: transitionHeight }}
      >
        <div>Error: {error.message}</div>
      </div>
    );
  }

  return transitionImageUrl ? (
    <div>
      <img src={transitionImageUrl} alt={alt} className={className} />
    </div>
  ) : null;
};
