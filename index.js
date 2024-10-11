import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import morgan from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
import userRoutes from './routes/users.js'
import channelRoutes from './routes/channel.js'
import adminRoutes from './routes/admin.js'
import postedAdsRoutes from './routes/postedAds.js'
import authRoutes from './routes/auth.js'
import companyRoutes from './routes/company.js'
import campaignRoutes from './routes/campaign.js'
import PostCreativeRoutes from './routes/postCreatives.js'
import helloRoutes from './routes/hello.js'
import engagementRoutes from './routes/engagement.js'
import statRoutes from './routes/stat.js'
import individualRoutes from './routes/individual.js'
import accountRoutes from './routes/account.js'
import logger from './logger/logger.js'
import errorHandler from './middleware/errorHandler.js'
import googleAuthRoutes from './routes/authRoutes.js'
import corsMiddleware from './middleware/corsMiddleware.js'
import cookieParser from 'cookie-parser';
import { sessionMiddleware } from './config/sessionConfig.js'
import { logResponseMiddleware } from './middleware/logResponseMiddleware.js'

const app = express()
dotenv.config()

app.use(bodyParser.json({ limit: "30mb", extended: true }))
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }))
app.use(cors())

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Middleware for checking authentication token
const authMiddleware = (req, res, next) => {
  const publicRoutes = ['/auth/authorize', '/auth/oauth2callback']; // OAuth public routes
  if (publicRoutes.includes(req.path)) {
    return next(); // Skip auth for these routes
  }

  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'No authentication token, access denied' });
  }

  // Token validation logic...
  next();
};

app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);
app.use('/auth', authRoutes);

// Apply the middleware only to secured routes
app.use('/users', userRoutes);
app.use('/channel', authMiddleware, channelRoutes);
app.use('/admin', authMiddleware, adminRoutes);
app.use('/posted_ads', authMiddleware, postedAdsRoutes);
app.use('/company', authMiddleware, companyRoutes);
app.use('/campaign', authMiddleware, campaignRoutes);
app.use('/post_creatives', authMiddleware, PostCreativeRoutes);
app.use('/stat', authMiddleware, statRoutes);
app.use('/individual', authMiddleware, individualRoutes);
app.use('/account', authMiddleware, accountRoutes);
app.use('/hello', helloRoutes); // No auth needed
app.use('/engagement', authMiddleware, engagementRoutes);
app.use('/google-auth', googleAuthRoutes);
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(logResponseMiddleware);
// Unprotected auth routes for OAuth

app.use(errorHandler)

const CONNECTION_URL = process.env.CONNECTION_URL;
const PORT = process.env.BACKEND_PORT || 3500;

mongoose.set('strictQuery', true);

mongoose.connect(CONNECTION_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => app.listen(PORT, () => logger.info(`Server running on port: ${PORT}`)))
  .catch((error) => console.log(error.message));

