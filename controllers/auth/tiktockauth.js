import querystring from "querystring";
import axios from "axios";

export const getOAuthUrl = (req, res) => {
  const csrfState = Math.random().toString(36).substring(2);
  res.cookie("csrfState", csrfState, { maxAge: 60000 });
  let url = "https://www.tiktok.com/v2/auth/authorize/";
  url += "?client_key=aw0h2vs3s39ad7dk";
  url += "&scope=user.info.basic,video.upload,video.publish";
  url += "&response_type=code";
  url += "&redirect_uri=https://redirect-uri-tan.vercel.app/redirect";
  url += "&state=" + csrfState;
  res.json({ url: url });
};

export const getTikTokAccessToken = async (req, res) => {
  try {
    const { code } = req.body;
    const decode = decodeURI(code);
    const tokenEndpoint = "https://open.tiktokapis.com/v2/oauth/token/";
    const params = {
      client_key: process.env.CLIENT_KEY,
      clientSecret: process.env.CLIENT_SECRET_TIKTOK,
      redirect_uri_tikitok: process.env.REDIRECT_URI_TIKTOK,
      code: decode,
      grant_type: "authorization_code",
    };

    const response = await axios.post(
      tokenEndpoint,
      querystring.stringify(params),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache",
        },
      }
    );
    console.log("response>>>>>>>", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Error during callback:", error.message);
    res.status(500).json({ error: "An error occurred during the login process." });
  }
};

