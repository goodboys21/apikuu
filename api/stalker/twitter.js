/**
 * Twitter Stalker
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

async function getTwitterProfile(username) {
  try {
    const response = await axios({
      method: "get",
      url: `https://x.com/i/api/graphql/32pL5BWe9WKeSK1MoPvFQQ/UserByScreenName?variables=%7B%22screen_name%22%3A%22${username}%22%7D&features=%7B%22hidden_profile_subscriptions_enabled%22%3Atrue%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Atrue%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22subscriptions_verification_info_is_identity_verified_enabled%22%3Atrue%2C%22subscriptions_verification_info_verified_since_enabled%22%3Atrue%2C%22highlights_tweets_tab_ui_enabled%22%3Atrue%2C%22responsive_web_twitter_article_notes_tab_enabled%22%3Atrue%2C%22subscriptions_feature_can_gift_premium%22%3Atrue%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%7D&fieldToggles=%7B%22withAuxiliaryUserLabels%22%3Afalse%7D`,
      headers: {
        authority: "x.com",
        accept: "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        authorization:
          "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
        "content-type": "application/json",
        cookie:
          'guest_id=v1%3A173113403636768133; night_mode=2; guest_id_marketing=v1%3A173113403636768133; guest_id_ads=v1%3A173113403636768133;',
        referer: `https://x.com/${username}`,
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      },
      timeout: 30000,
    });

    const userData = response.data.data.user.result;
    const legacy = userData.legacy;

    let profileImageUrl = legacy.profile_image_url_https;
    if (profileImageUrl) profileImageUrl = profileImageUrl.replace("_normal.", "_400x400.");

    return {
      id: userData.rest_id,
      username: legacy.screen_name,
      name: legacy.name,
      verified: userData.is_blue_verified,
      verified_type: legacy.verified_type || null,
      description: legacy.description,
      location: legacy.location,
      created_at: legacy.created_at,
      stats: {
        tweets: legacy.statuses_count,
        following: legacy.friends_count,
        followers: legacy.followers_count,
        likes: legacy.favourites_count,
        media: legacy.media_count,
      },
      profile: {
        image: profileImageUrl,
        banner: legacy.profile_banner_url || null,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching Twitter user: ${error.message}`);
  }
}

// Endpoint Express
router.get("/twitter", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ status: false, message: "Parameter 'username' dibutuhkan" });

  try {
    const data = await getTwitterProfile(username);
    res.json({ status: true, creator: "Bagus Bahril", user: data });
  } catch (err) {
    res.status(500).json({ status: false, creator: "Bagus Bahril", message: err.message });
  }
});

module.exports = router;
