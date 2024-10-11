

import { google } from 'googleapis';
import axios from 'axios';
import Users from '../../models/users.js';

// Function to generate the Google OAuth2 URL and send it to the client
export const authorize = (req, res) => {
  // console.log("Authorize - Request Params:", req.query);
  // console.log(req.params)
  const oauth2Client = new google.auth.OAuth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: `${req.protocol}://${req.get("host")}/auth/oauth2Callback/${req.query["userId"]}`, // Use dynamic redirect URI
  });
  // ewwewff
  const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: SCOPES,
    prompt: 'consent', // To always get refresh token
  });

  console.log("Authorization URL generated:", authorizationUrl);
  res.json({ authorization_url: authorizationUrl }); // Send the URL back to the client
};

export const oauth2Callback_2 = async (req, res) => {
  console.log("OAuth Callback - Request Params:", req.params);
  console.log("OAuth Callback - Request Query:", req.query);
  const oauth2Client = new google.auth.OAuth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: `${req.protocol}://${req.get("host")}/auth/oauth2Callback/${req.params["id"]}`,
  });

  const { code } = req.query;

  const { id: id } = req.params
  console.log(id)
  console.log("OAuth Callback - Received Code:", code);

  if (!code) {
    console.error('No code provided in OAuth2 callback');
    return res.status(400).send('Invalid request: No code provided');
  }

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log("OAuth Callback - Full Tokens Received:", tokens);

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Failed to receive tokens from Google OAuth');
      return res.status(500).json({ error: 'Failed to receive access/refresh tokens' });
    }

    oauth2Client.setCredentials(tokens); // Set the tokens for future use
    const user = await Users.findOneAndUpdate(
      { _id: id },
      {
        // platform: ['youtube'],
        youtubeAccessToken: tokens.access_token,
        youtubeRefreshToken: tokens.refresh_token,
        youtubeTokenExpiresIn: tokens.expiry_date,
        // verificationCode: verificationCode,
        // codeExpiration: expirationTime,
        // isVerified: false
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).send('User not found');
    }
    // Save tokens in the database (optional) or session here if needed

    // Redirect the user to a specific route after successful authentication
    return res.redirect('http://localhost:3000/platformAuth'); // Change this to your desired route
  } catch (err) {
    console.error('Error during OAuth token exchange:', err);
    res.status(500).send('Token exchange failed.');
  }
};

// Function to handle the OAuth2 callback and token exchange
export const oauth2Callback = async (req, res) => {
  console.log("OAuth Callback - Request Query:", req.query);

  const oauth2Client = new google.auth.OAuth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: `${req.protocol}://${req.get("host")}/auth/oauth2Callback`,
  });

  const { code } = req.query;
  console.log("OAuth Callback - Received Code:", code);

  if (!code) {
    console.error('No code provided in OAuth2 callback');
    return res.status(400).send('Invalid request: No code provided');
  }

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log("OAuth Callback - Full Tokens Received:", tokens);

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Failed to receive tokens from Google OAuth');
      return res.status(500).json({ error: 'Failed to receive access/refresh tokens' });
    }

    oauth2Client.setCredentials(tokens); // Set the tokens for future use

    // Save tokens in the database (optional) or session here if needed

    // Redirect the user to a specific route after successful authentication
    return res.redirect('http://localhost:3000/youtube-callback'); // Change this to your desired route
  } catch (err) {
    console.error('Error during OAuth token exchange:', err);
    res.status(500).send('Token exchange failed.');
  }
};

