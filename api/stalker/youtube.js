/**
 * YouTube Channel Scraper
 * Creator: Bagus Bahril
 */

const express = require("express");
const needle = require("needle");
const cheerio = require("cheerio");

const router = express.Router();

const proxy = () => null; // bisa lo modif kalo mau pake proxy

router.get("/youtube", async (req, res) => {
  const username = req.query.username?.trim();
  if (!username) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Username parameter is required",
    });
  }

  try {
    const options = {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,id;q=0.8",
      },
    };

    const url = `https://youtube.com/@${username}`;
    const response = await needle("get", url, options);

    const $ = cheerio.load(response.body);
    const ytInitialDataScript = $('script')
      .filter((i, el) => $(el).html().includes("var ytInitialData ="))
      .html();

    const jsonData = ytInitialDataScript?.match(/var ytInitialData = (.*?);/);
    if (!jsonData || !jsonData[1])
      return res.status(404).json({
        status: false,
        creator: "Bagus Bahril",
        message: "Could not parse YouTube initial data",
      });

    const parsedData = JSON.parse(jsonData[1]);

    const channelMetadata = {
      username: null,
      name: null,
      subscriberCount: null,
      videoCount: null,
      avatarUrl: null,
      channelUrl: null,
      description: null,
    };

    // Extract channel info
    const header = parsedData.header?.pageHeaderRenderer;
    if (header) {
      channelMetadata.name =
        header.content?.pageHeaderViewModel?.title?.content || null;
      channelMetadata.username =
        header.content?.pageHeaderViewModel?.metadata?.contentMetadataViewModel
          ?.metadataRows[0]?.metadataParts[0]?.text?.content || null;

      const avatarSources =
        header.content?.pageHeaderViewModel?.image?.decoratedAvatarViewModel
          ?.avatar?.avatarViewModel?.image?.sources;
      if (avatarSources?.length) channelMetadata.avatarUrl = avatarSources[0].url;
    }

    const meta = parsedData.metadata?.channelMetadataRenderer;
    if (meta) {
      channelMetadata.description = meta.description;
      channelMetadata.channelUrl = meta.channelUrl;
    }

    // Extract subscriber & video count
    const metadataRows =
      parsedData.header?.pageHeaderRenderer?.content?.pageHeaderViewModel
        ?.metadata?.contentMetadataViewModel?.metadataRows;
    if (metadataRows?.length > 1) {
      metadataRows[1].metadataParts.forEach((part) => {
        if (part.text?.content) {
          if (part.text.content.includes("subscribers"))
            channelMetadata.subscriberCount = part.text.content;
          if (part.text.content.includes("videos"))
            channelMetadata.videoCount = part.text.content;
        }
      });
    }

    // Extract latest 5 videos
    const videoDataList = [];
    const tabs = parsedData.contents?.twoColumnBrowseResultsRenderer?.tabs;
    if (tabs?.length) {
      const videosTab =
        tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
      let videoCount = 0;
      for (const item of videosTab) {
        if (videoCount >= 5) break;

        if (item.itemSectionRenderer) {
          for (const content of item.itemSectionRenderer.contents) {
            const items =
              content?.shelfRenderer?.content?.horizontalListRenderer?.items || [];
            for (const video of items) {
              if (videoCount >= 5) break;
              if (video.gridVideoRenderer) {
                const v = video.gridVideoRenderer;
                videoDataList.push({
                  videoId: v.videoId,
                  title: v.title.simpleText,
                  thumbnail: v.thumbnail.thumbnails[0].url,
                  publishedTime: v.publishedTimeText?.simpleText || null,
                  viewCount: v.viewCountText?.simpleText || null,
                  duration:
                    v.thumbnailOverlays?.find(
                      (o) => o.thumbnailOverlayTimeStatusRenderer
                    )?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText || null,
                  videoUrl: `https://m.youtube.com/watch?v=${v.videoId}`,
                });
                videoCount++;
              }
            }
          }
        }
      }
    }

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      channel: channelMetadata,
      latest_videos: videoDataList,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Gagal mengambil data YouTube",
    });
  }
});

module.exports = router;
