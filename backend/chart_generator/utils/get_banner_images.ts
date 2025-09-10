import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

chromium.setHeadlessMode = "shell";
chromium.setGraphicsMode = false;

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

  console.log(`Starting banner scrape for ${artists.artists.length} artists`);
  console.log(JSON.stringify(artists, null, 2));

  const artistIds = artists.artists.map((artist) => artist.artist_id);

  try {
    const executablePath = await chromium.executablePath();

    // Launch Puppeteer browser with @sparticuz/chromium
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: true,
      userDataDir: "/tmp/chromeData",
    });

    console.log("Browser launched successfully");

    // Process artists in order until we have 3 banners
    for (const artistId of artistIds) {
      if (banners.length >= 3) {
        break; // Stop once we have 3 banners
      }

      let page;
      try {
        console.log(
          `Processing artist ${artistId} (${banners.length + 1}/${Math.min(
            artistIds.length,
            3
          )})`
        );

        page = await browser.newPage();

        // Set user agent and viewport
        await page.setUserAgent(
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        );
        await page.setViewport({ width: 2560, height: 1440 });

        // Set extra HTTP headers
        await page.setExtraHTTPHeaders({
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        });

        // Remove automation indicators
        await page.evaluateOnNewDocument(() => {
          delete (window as any).navigator.webdriver;
          Object.defineProperty(navigator, "plugins", {
            get: () => [1, 2, 3, 4, 5],
          });
          Object.defineProperty(navigator, "languages", {
            get: () => ["en-US", "en"],
          });
          Object.defineProperty(navigator, "platform", {
            get: () => "MacIntel",
          });
        });

        const url = `https://open.spotify.com/artist/${artistId}`;

        // Navigate to the page with retry logic
        let navigationSuccess = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await page.goto(url, {
              waitUntil: "domcontentloaded",
              timeout: 45000,
            });
            navigationSuccess = true;
            break;
          } catch (navError) {
            console.log(
              `Navigation attempt ${attempt} failed for ${artistId}:`
            );
            if (attempt === 3) throw navError;
            await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait before retrying
          }
        }

        if (!navigationSuccess) {
          console.log(
            `❌ Artist ${artistId}: Failed to navigate after 3 attempts`
          );
          continue;
        }

        // Wait for content to load
        await new Promise((resolve) => setTimeout(resolve, 8000));

        // Check if we got an error page
        const hasError = (await page.$("text=Something went wrong")) !== null;

        if (hasError) {
          console.log(`❌ Artist ${artistId}: Spotify blocked the request`);
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
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Error processing artist ${artistId}:`, error);
        // Continue to next artist even if this one fails
      } finally {
        // Always close the page to free up memory
        if (page) {
          try {
            await page.close();
          } catch (closeError) {
            console.warn(
              `Warning: Could not close page for ${artistId}:`,
              closeError
            );
          }
        }
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
    console.error("Error in scrapeBanners:", error);
    return banners; // Return whatever banners we managed to collect
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.warn("Warning: Could not close browser:", closeError);
      }
    }
  }
};

// Uncomment for local testing
// console.log(
//   scrapeBanners({
//     artists: [
//       {
//         artist_id: "6YVMFz59CuY7ngCxTxjpxE",
//         artist_name: "Aespa",
//       },
//       {
//         artist_id: "250b0Wlc5Vk0CoUsaCY84M",
//         artist_name: "JENNIE",
//       },
//       {
//         artist_id: "7n2Ycct7Beij7Dj7meI4X0",
//         artist_name: "Twice",
//       },
//     ],
//   })
// );
