import querystring from "querystring";
import axios from "axios";
import Users from '../../models/users.js';

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
    const decode = decodeURI(tokendata)
    const tokenEndpoint = "https://open.tiktokapis.com/v2/oauth/token/";
    const params = {
      client_key: process.env.CLIENT_KEY,
      clientSecret: process.env.CLIENT_SECRET_TIKTOK,
      redirect_uri_tikitok: process.env.REDIRECT_URI_TIKTOK,
      tokendata: decode,
      grant_type: "authorization_code",
    };

    const response = await axios.post(
      tokenEndpoint,
      querystring.stringify(params),
      {

        token: tokendata,
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

// controllers/tiktokController.js
export const handleTikTokOAuth = async (req, res) => {
  const { code, userId, accessToken, expiresIn, refreshToken } = req.body;
  try {
    // Log received data for debugging
    console.log('Received TikTok code:', code, 'for user:', userId);
    console.log('Access Token:', accessToken);
    console.log('Expires In:', expiresIn, 'seconds');
    console.log('Refresh Token:', refreshToken);

    // Here, you might use accessToken and refreshToken to perform further actions,
    // such as storing them in a database or making API calls.

    const user = await Users.findOneAndUpdate(
      { _id: userId },  // find a document by userId
      {
        tiktokAccessToken: accessToken,
        tiktokRefreshToken: refreshToken,
        tiktokTokenExpiresIn: expiresIn
      },
      { new: true, upsert: true }  // options: return new doc and create if not exists
    );


    // Assume the processing is successful
    res.json({
      success: true,
      message: "TikTok OAuth successful.",
      data: {
        userId,
        accessToken,
        expiresIn,
        refreshToken
      }
    });
  } catch (error) {
    console.error("TikTok OAuth error:", error);
    res.status(500).json({ success: false, message: "Failed to process TikTok OAuth." });
  }
};


