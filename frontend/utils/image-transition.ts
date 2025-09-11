interface TransitionOptions {
  transitionHeight?: number;
  outputWidth?: number;
}

export class ImageTransitionGenerator {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private initCanvas(): void {
    if (typeof window === "undefined") {
      throw new Error("Canvas operations must be run in the browser");
    }

    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.ctx = this.canvas.getContext("2d");

      if (!this.ctx) {
        throw new Error("Could not get 2D context from canvas");
      }
    }
  }

  async createTransition(
    img1Src: string,
    img2Src: string,
    options: TransitionOptions = {}
  ): Promise<string> {
    this.initCanvas();

    const [image1, image2] = await Promise.all([
      this.loadImage(img1Src),
      this.loadImage(img2Src),
    ]);

    const {
      transitionHeight = 250,
      outputWidth = Math.max(image1.width, image2.width),
    } = options;

    // Set canvas dimensions
    this.canvas!.width = outputWidth;
    this.canvas!.height = transitionHeight;
    this.ctx!.clearRect(0, 0, outputWidth, transitionHeight);

    // Get the bottom row of pixels from image1 and top row from image2
    const bottomPixels = this.getBottomPixels(image1, outputWidth);
    const topPixels = this.getTopPixels(image2, outputWidth);

    // Create the transition image
    this.createVerticalGradientTransition(
      bottomPixels,
      topPixels,
      outputWidth,
      transitionHeight
    );

    return this.canvas!.toDataURL("image/png");
  }

  private getBottomPixels(
    image: HTMLImageElement,
    outputWidth: number
  ): Uint8ClampedArray {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d")!;

    tempCanvas.width = outputWidth;
    tempCanvas.height = 1;

    // Draw the bottom row of the image, scaled to output width
    tempCtx.drawImage(
      image,
      0,
      image.height - 1,
      image.width,
      1, // source: bottom row
      0,
      0,
      outputWidth,
      1 // destination: full width, 1px height
    );

    return tempCtx.getImageData(0, 0, outputWidth, 1).data;
  }

  private getTopPixels(
    image: HTMLImageElement,
    outputWidth: number
  ): Uint8ClampedArray {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d")!;

    tempCanvas.width = outputWidth;
    tempCanvas.height = 1;

    // Draw the top row of the image, scaled to output width
    tempCtx.drawImage(
      image,
      0,
      0,
      image.width,
      1, // source: top row
      0,
      0,
      outputWidth,
      1 // destination: full width, 1px height
    );

    return tempCtx.getImageData(0, 0, outputWidth, 1).data;
  }

  private createVerticalGradientTransition(
    bottomPixels: Uint8ClampedArray,
    topPixels: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    const imageData = this.ctx!.createImageData(width, height);

    // For each column (x position)
    for (let x = 0; x < width; x++) {
      const pixelIndex = x * 4; // RGBA = 4 values per pixel

      // Get the bottom pixel color from image1 and top pixel color from image2
      const bottomR = bottomPixels[pixelIndex];
      const bottomG = bottomPixels[pixelIndex + 1];
      const bottomB = bottomPixels[pixelIndex + 2];
      const bottomA = bottomPixels[pixelIndex + 3];

      const topR = topPixels[pixelIndex];
      const topG = topPixels[pixelIndex + 1];
      const topB = topPixels[pixelIndex + 2];
      const topA = topPixels[pixelIndex + 3];

      // For each row (y position) in this column, create a gradient
      for (let y = 0; y < height; y++) {
        const progress = y / (height - 1); // 0 at top, 1 at bottom
        const outputPixelIndex = (y * width + x) * 4;

        // Linear interpolation from bottom color (image1) to top color (image2)
        imageData.data[outputPixelIndex] = Math.round(
          bottomR * (1 - progress) + topR * progress
        ); // Red

        imageData.data[outputPixelIndex + 1] = Math.round(
          bottomG * (1 - progress) + topG * progress
        ); // Green

        imageData.data[outputPixelIndex + 2] = Math.round(
          bottomB * (1 - progress) + topB * progress
        ); // Blue

        imageData.data[outputPixelIndex + 3] = Math.round(
          bottomA * (1 - progress) + topA * progress
        ); // Alpha
      }
    }

    this.ctx!.putImageData(imageData, 0, 0);
  }

  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

// Utility function
export const createImageTransition = async (
  image1Url: string,
  image2Url: string,
  transitionHeight: number = 250
): Promise<string> => {
  const generator = new ImageTransitionGenerator();
  return await generator.createTransition(image1Url, image2Url, {
    transitionHeight,
  });
};
