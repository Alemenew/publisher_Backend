// import express from 'express'

// import { getAuthUser, getAuthUsers, login, registerAuth, testAuthToken } from '../controllers/auth/auth.js'
// import authenticate from '../middleware/authenticationMiddleware.js'
// import { createRole, getRoles } from '../controllers/auth/role.js'
// import checkPermission from '../middleware/permissionMiddleware.js'


// const router = express.Router()

// router.post('/register', registerAuth)
// router.post('/login', login)
// router.get('/', authenticate, checkPermission('update', 'auths'), getAuthUsers)
// router.get('/test_auth', authenticate, testAuthToken)

// router.get('/role', authenticate, getRoles)
// router.post('/role', authenticate, createRole)

// router.get('/:username', authenticate, getAuthUser)


// export default router
import { getOAuthUrl, getTikTokAccessToken, handleTikTokOAuth } from "../controllers/auth/tiktockauth.js";
import {
  checkemail,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserType
} from "../controllers/users.js";
import { authorize, oauth2Callback, oauth2Callback_2 } from "../controllers/auth/youtubeController.js";
import express from 'express';
import {
  getAuthUser,
  getAuthUsers,
  login,
  registerAuth,
  testAuthToken
} from '../controllers/auth/auth.js';




import authenticate from '../middleware/authenticationMiddleware.js';
import {
  createRole,
  getRoles
} from '../controllers/auth/role.js';
import checkPermission from '../middleware/permissionMiddleware.js';
import {
  sendVerificationCode,
  verifyEmailCode,
} from '../controllers/auth/emailVerification.js';

import { trackTelegram } from "../controllers/auth/telegram.js";

const router = express.Router();

// OAuth-related routes for Google 

router.get('/authorize', authorize);
router.get('/oauth2callback', oauth2Callback);
router.get('/oauth2callback/:id', oauth2Callback_2);
// OAuth-related routes for TikTok

router.get("/oauth", getOAuthUrl);
router.post("/tiktokaccesstoken", getTikTokAccessToken);
router.post('/tiktokcallback2', handleTikTokOAuth)


router.post('/trackTelegram', trackTelegram);

// User registration
router.post('/register', registerAuth);

// Login route
router.post('/login', login);

// OAuth-related routes
router.get('/authorize', authorize); // Generates the Google OAuth URL
router.get('/oauth2callback', oauth2Callback); // Handles OAuth callback

// Protected routes
router.get('/', authenticate, checkPermission('update', 'auths'), getAuthUsers);
router.get('/test_auth', authenticate, testAuthToken);

// Role management
router.get('/role', getRoles);
router.post('/role', authenticate, createRole);



// Get a single user by username
router.get('/:username', authenticate, getAuthUser);

// Email verification routes
router.post('/send-verification-code', sendVerificationCode);
router.post('/verify-email', verifyEmailCode);
router.post('/checkemail', checkemail);
router.get('/usertype', getUserType);
router.get('/user/:id', getUser);
router.post('/user', createUser);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);



export default router;

