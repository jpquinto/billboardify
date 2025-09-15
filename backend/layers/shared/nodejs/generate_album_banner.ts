import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

interface S3UploadResult {
  s3Url: string;
  bucketName: string;
  key: string;
  contentType: string;
  size: number;
}

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface ColorWithCount extends ColorRGB {
  count: number;
}

interface BannerResult {
  s3Url: string;
  primaryColor: string | null;
  secondaryColor: string | null;
}

const S3_CLIENT = new S3Client({});
const { PUBLIC_ASSETS_BUCKET_NAME } = process.env;

interface WaveOptions {
  amplitude?: number; // How far the waves wiggle (default: 15)
  frequency?: number; // How many waves per height (default: 3)
  randomness?: number; // Random variation (default: 0.2)
  smoothness?: number; // How smooth the transition is (default: 5)
}

interface GradientImageOptionsSharp {
  gradientWidth?: number;
  middleBlendWidth?: number;
  outputFormat?: "png" | "jpeg" | "webp";
  quality?: number;
  waveOptions?: WaveOptions;
}

/**
 * Extracts the two most prominent and distinct colors from an image
 * @param imageBuffer - The image buffer to analyze
 * @returns Promise with primary and secondary colors, or nulls if not found
 */
async function extractProminentColors(imageBuffer: Buffer): Promise<{
  primaryColor: ColorRGB | null;
  secondaryColor: ColorRGB | null;
}> {
  try {
    // Resize image to 100x100 for faster processing while maintaining color accuracy
    const resizedBuffer = await sharp(imageBuffer)
      .resize(100, 100, { fit: "cover" })
      .raw()
      .toBuffer();

    const colorMap = new Map<string, ColorWithCount>();

    // Count colors with quantization to group similar colors
    for (let i = 0; i < resizedBuffer.length; i += 3) {
      const r = resizedBuffer[i];
      const g = resizedBuffer[i + 1];
      const b = resizedBuffer[i + 2];

      // Quantize colors to reduce noise (group similar colors)
      const quantizedR = Math.round(r / 16) * 16;
      const quantizedG = Math.round(g / 16) * 16;
      const quantizedB = Math.round(b / 16) * 16;

      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;

      if (colorMap.has(colorKey)) {
        colorMap.get(colorKey)!.count++;
      } else {
        colorMap.set(colorKey, {
          r: quantizedR,
          g: quantizedG,
          b: quantizedB,
          count: 1,
        });
      }
    }

    // Convert to array and sort by frequency
    const sortedColors = Array.from(colorMap.values()).sort(
      (a, b) => b.count - a.count
    );

    // Filter out colors that are too similar to black, white, or gray
    const filteredColors = sortedColors.filter((color) => {
      const brightness = (color.r + color.g + color.b) / 3;
      const isNotBlackish = brightness > 30;
      const isNotWhitish = brightness < 225;
      const hasColorSaturation =
        Math.max(color.r, color.g, color.b) -
          Math.min(color.r, color.g, color.b) >
        20;

      return isNotBlackish && isNotWhitish && hasColorSaturation;
    });

    if (filteredColors.length === 0) {
      return { primaryColor: null, secondaryColor: null };
    }

    const primaryColor = filteredColors[0];
    let secondaryColor = null;

    // Find a secondary color that's distinct enough from the primary
    for (let i = 1; i < filteredColors.length; i++) {
      const candidate = filteredColors[i];
      const colorDistance = calculateColorDistance(primaryColor, candidate);

      // Colors should be at least 60 units apart in RGB space to be considered distinct
      if (colorDistance > 60) {
        secondaryColor = candidate;
        break;
      }
    }

    return {
      primaryColor: primaryColor
        ? { r: primaryColor.r, g: primaryColor.g, b: primaryColor.b }
        : null,
      secondaryColor: secondaryColor
        ? { r: secondaryColor.r, g: secondaryColor.g, b: secondaryColor.b }
        : null,
    };
  } catch (error) {
    console.error("Error extracting prominent colors:", error);
    return { primaryColor: null, secondaryColor: null };
  }
}

/**
 * Calculates the Euclidean distance between two colors in RGB space
 */
function calculateColorDistance(color1: ColorRGB, color2: ColorRGB): number {
  const rDiff = color1.r - color2.r;
  const gDiff = color1.g - color2.g;
  const bDiff = color1.b - color2.b;

  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

export async function generateGradientTransitionImage(
  imageUrl: string,
  options: GradientImageOptionsSharp = {}
): Promise<Buffer> {
  const {
    gradientWidth = 250,
    outputFormat = "png",
    quality = 90,
    waveOptions = {},
  } = options;

  try {
    // Fetch image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image");
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Get image metadata
    const { width, height } = await sharp(imageBuffer).metadata();
    if (!width || !height)
      throw new Error("Could not determine image dimensions");

    // Extract edge colors from original image
    const leftEdgeColors = await extractEdgeStrip(
      imageBuffer,
      "left",
      width,
      height
    );
    const rightEdgeColors = await extractEdgeStrip(
      imageBuffer,
      "right",
      width,
      height
    );

    // Calculate average color for entire left and right edges
    const leftAverageColor = calculateAverageColor(leftEdgeColors);
    const rightAverageColor = calculateAverageColor(rightEdgeColors);

    // Create blending sections that transition from edge colors to average colors
    const leftBlendSection = await createWideBlendingSection(
      gradientWidth,
      height,
      leftEdgeColors, // Start with actual edge colors
      leftAverageColor, // Blend to average color
      "left",
      waveOptions
    );

    const rightBlendSection = await createWideBlendingSection(
      gradientWidth,
      height,
      rightEdgeColors, // Start with actual edge colors
      rightAverageColor, // Blend to average color
      "right",
      waveOptions
    );

    // Create the final extended image with 3 sections
    const extendedWidth = width + gradientWidth * 2;

    // Start with transparent background
    const result = await sharp({
      create: {
        width: extendedWidth,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    }).composite([
      // Section 1: Left blending section
      { input: leftBlendSection, left: 0, top: 0, blend: "over" },

      // Section 2: Original image in the middle
      {
        input: imageBuffer,
        left: gradientWidth,
        top: 0,
        blend: "over",
      },

      // Section 3: Right blending section
      {
        input: rightBlendSection,
        left: gradientWidth + width,
        top: 0,
        blend: "over",
      },
    ]);

    // Output in requested format
    if (outputFormat === "jpeg") {
      return result.jpeg({ quality }).toBuffer();
    } else if (outputFormat === "webp") {
      return result.webp({ quality }).toBuffer();
    } else {
      return result.png().toBuffer();
    }
  } catch (error) {
    throw new Error(
      `Failed to generate melting effect: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// New function to calculate average color from an array of colors
function calculateAverageColor(colors: { r: number; g: number; b: number }[]): {
  r: number;
  g: number;
  b: number;
} {
  if (colors.length === 0) return { r: 0, g: 0, b: 0 };

  let totalR = 0,
    totalG = 0,
    totalB = 0;

  for (const color of colors) {
    totalR += color.r;
    totalG += color.g;
    totalB += color.b;
  }

  return {
    r: Math.round(totalR / colors.length),
    g: Math.round(totalG / colors.length),
    b: Math.round(totalB / colors.length),
  };
}

async function createWideBlendingSection(
  width: number,
  height: number,
  edgeColors: { r: number; g: number; b: number }[],
  averageColor: { r: number; g: number; b: number },
  side: "left" | "right",
  waveOptions: WaveOptions = {}
): Promise<Buffer> {
  const canvas = Buffer.alloc(width * height * 4); // RGBA

  for (let y = 0; y < height; y++) {
    const gradientLength = Math.floor(Math.random() * 401) + 200;
    console.log(`Row ${y}: gradientLength = ${gradientLength}`);
    const edgeColor = edgeColors[y] || { r: 0, g: 0, b: 0 };

    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;

      let blendFactor;
      if (side === "left") {
        // Gradient from the right edge of the section (x = width-1) to gradientLength inwards
        // The blend factor should be 0 at the start of the gradient (x = width - gradientLength) and 1 at the end (x = width - 1)
        blendFactor = Math.min(
          1,
          Math.max(0, (x - (width - gradientLength)) / (gradientLength - 1))
        );
      } else {
        // Gradient from the left edge of the section (x = 0) to gradientLength outwards
        // The blend factor should be 1 at the start (x = 0) and 0 at the end (x = gradientLength - 1)
        blendFactor = Math.min(
          1,
          Math.max(0, (gradientLength - 1 - x) / (gradientLength - 1))
        );
      }

      // Interpolate the color
      const finalColor = {
        r: Math.round(
          edgeColor.r * blendFactor + averageColor.r * (1 - blendFactor)
        ),
        g: Math.round(
          edgeColor.g * blendFactor + averageColor.g * (1 - blendFactor)
        ),
        b: Math.round(
          edgeColor.b * blendFactor + averageColor.b * (1 - blendFactor)
        ),
      };

      // Set pixel color
      canvas[pixelIndex] = finalColor.r;
      canvas[pixelIndex + 1] = finalColor.g;
      canvas[pixelIndex + 2] = finalColor.b;

      // Alpha is now fully opaque for every pixel
      canvas[pixelIndex + 3] = 255;
    }
  }

  // Convert raw buffer to PNG using Sharp
  return sharp(canvas, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

async function extractEdgeStrip(
  imageBuffer: Buffer,
  side: "left" | "right",
  width: number,
  height: number
): Promise<{ r: number; g: number; b: number }[]> {
  const edgeX = side === "left" ? 0 : width - 1;

  // Extract the edge column as raw RGB data
  const edgeStrip = await sharp(imageBuffer)
    .extract({ left: edgeX, top: 0, width: 1, height })
    .raw()
    .toBuffer();

  const colors: { r: number; g: number; b: number }[] = [];

  // Extract color for each row
  for (let y = 0; y < height; y++) {
    const pixelOffset = y * 3; // RGB, no alpha
    colors.push({
      r: edgeStrip[pixelOffset] || 0,
      g: edgeStrip[pixelOffset + 1] || 0,
      b: edgeStrip[pixelOffset + 2] || 0,
    });
  }

  return colors;
}

/**
 * Uploads an image buffer to AWS S3
 * @param imageBuffer - The processed image buffer to upload
 * @param bucketName - S3 bucket name
 * @param key - S3 object key (file path in bucket)
 * @param contentType - MIME type (e.g., 'image/png', 'image/jpeg')
 * @param s3Client - Configured AWS S3 client (optional, uses global S3_CLIENT if not provided)
 * @returns Promise<S3UploadResult> - Upload result with S3 URL and metadata
 */
export async function uploadImageToS3(
  imageBuffer: Buffer,
  bucketName: string,
  key: string,
  contentType: string,
  s3Client: S3Client = S3_CLIENT
): Promise<S3UploadResult> {
  try {
    const putObjectCommand = new PutObjectCommand({
      Bucket: PUBLIC_ASSETS_BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
      //   ACL: "public-read", // Make the image publicly accessible
    });

    await s3Client.send(putObjectCommand);

    // Construct the S3 URL manually since the v3 SDK doesn't return Location
    const s3Url = `https://${PUBLIC_ASSETS_BUCKET_NAME}.s3.amazonaws.com/${key}`;

    return {
      s3Url,
      bucketName,
      key,
      contentType,
      size: imageBuffer.length,
    };
  } catch (error) {
    throw new Error(
      `Failed to upload to S3: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function generateImageBanner(
  albumId: string,
  imageUrl: string
): Promise<BannerResult> {
  try {
    // Step 1: Fetch the original image to extract colors
    console.log("Fetching original image for color analysis...");
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image");
    const originalImageBuffer = Buffer.from(await response.arrayBuffer());

    // Step 2: Extract prominent colors from the original image
    console.log("Extracting prominent colors...");
    const { primaryColor, secondaryColor } = await extractProminentColors(
      originalImageBuffer
    );

    console.log("Primary color:", primaryColor);
    console.log("Secondary color:", secondaryColor);

    // Step 3: Generate the melting transition images with different effects
    console.log("Generating melting transitions...");

    // Subtle melting effect
    const imageBuffer3 = await generateGradientTransitionImage(imageUrl, {
      gradientWidth: 700,
      waveOptions: {
        amplitude: 25,
        frequency: 4,
        randomness: 0.15,
        smoothness: 12,
      },
    });

    const result = await uploadImageToS3(
      imageBuffer3,
      process.env.PUBLIC_ASSETS_BUCKET_NAME!,
      `albums/banners/${albumId}.png`,
      "image/png"
    );

    console.log("✅ Image Upload Success!");

    return {
      s3Url: result.s3Url,
      primaryColor: primaryColor ? JSON.stringify(primaryColor) : null,
      secondaryColor: secondaryColor ? JSON.stringify(secondaryColor) : null,
    };
  } catch (error) {
    console.error("❌ Error processing image:", error);
    throw error;
  }
}
