import { chromium } from "playwright-core";

import { Banner } from "chart_generator/types";

interface ScrapeBannersParams {
  artists: {
    artist_id: string;
    artist_name: string;
  }[];
}

export const scrapeBanners = async (
  artists: ScrapeBannersParams
): Promise<Banner[]> => {
  const banners: Banner[] = [];
  let browser;

  const artistIds = artists.artists.map((artist) => artist.artist_id);

  try {
    // Launch browser once and reuse it for all requests
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
      timezoneId: "America/New_York",
      extraHTTPHeaders: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    // Process artists in order until we have 3 banners
    for (const artistId of artistIds) {
      if (banners.length >= 3) {
        break; // Stop once we have 3 banners
      }

      try {
        console.log(
          `Processing artist ${artistId} (${banners.length + 1}/${Math.min(
            artistIds.length,
            3
          )})`
        );

        const page = await context.newPage();

        // Remove automation indicators
        await page.addInitScript(() => {
          delete (window as any).navigator.webdriver;
          Object.defineProperty(navigator, "plugins", {
            get: () => [1, 2, 3, 4, 5],
          });
          Object.defineProperty(navigator, "languages", {
            get: () => ["en-US", "en"],
          });
        });

        const url = `https://open.spotify.com/artist/${artistId}`;

        // Navigate to the page
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30000, // Reduced timeout for faster processing
        });

        // Wait for content to load
        await page.waitForTimeout(2000); // Reduced wait time

        // Check if we got an error page
        const hasError =
          (await page.locator("text=Something went wrong").count()) > 0;

        if (hasError) {
          console.log(`❌ Artist ${artistId}: Spotify blocked the request`);
          await page.close();
          continue; // Try next artist
        }

        // Look for background image using multiple approaches
        const backgroundImageUrl = await page.evaluate(() => {
          // Method 1: Look for the specific testid
          let element = document.querySelector(
            '[data-testid="background-image"]'
          );
          if (element) {
            const style = window.getComputedStyle(element);
            const backgroundImage = style.backgroundImage;
            const match = backgroundImage.match(/url\("(.+)"\)/);
            if (match) return match[1];
          }

          // Method 2: Look for any element with background-image containing spotify CDN
          const allElements = document.querySelectorAll("*");
          for (const el of allElements) {
            const style = window.getComputedStyle(el);
            const backgroundImage = style.backgroundImage;
            if (
              backgroundImage &&
              backgroundImage.includes("url(") &&
              (backgroundImage.includes("scdn.co") ||
                backgroundImage.includes("spotifycdn"))
            ) {
              const match = backgroundImage.match(/url\("(.+)"\)/);
              if (match) return match[1];
            }
          }

          // Method 3: Look in inline styles
          const elementsWithStyle = document.querySelectorAll(
            '[style*="background-image"]'
          );
          for (const el of elementsWithStyle) {
            const style = (el as HTMLElement).style.backgroundImage;
            if (
              style &&
              style.includes("url(") &&
              (style.includes("scdn.co") || style.includes("spotifycdn"))
            ) {
              const match = style.match(/url\("(.+)"\)/);
              if (match) return match[1];
            }
          }

          return null;
        });

        await page.close();

        if (backgroundImageUrl) {
          console.log(`✅ Artist ${artistId}: Found banner image`);
          banners.push({
            artist_name:
              artists.artists.find((artist) => artist.artist_id === artistId)
                ?.artist_name || "Unknown Artist",
            banner_url: backgroundImageUrl,
          });
        } else {
          console.log(`❌ Artist ${artistId}: No banner image found`);
        }

        // Add a small delay between requests to be respectful
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing artist ${artistId}:`, error);
        // Continue to next artist even if this one fails
        continue;
      }
    }

    console.log(
      `Successfully found ${banners.length} banners out of ${Math.min(
        artistIds.length,
        3
      )} attempted`
    );
    console.log(banners);
    return banners;
  } catch (error) {
    console.error("Error in getBanners:", error);
    return banners; // Return whatever banners we managed to collect
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

console.log(
  scrapeBanners({
    artists: [
      {
        artist_id: "6YVMFz59CuY7ngCxTxjpxE",
        artist_name: "Aespa",
      },
      {
        artist_id: "250b0Wlc5Vk0CoUsaCY84M",
        artist_name: "JENNIE",
      },
      {
        artist_id: "7n2Ycct7Beij7Dj7meI4X0",
        artist_name: "Twice",
      },
    ],
  })
);
