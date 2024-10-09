import express from "express";
import { addReactionEngagement, callUsEngagement, webVisitEngagement } from "../controllers/engagement/engagement.js";
import authenticate from "../middleware/authenticationMiddleware.js";

const router = express.Router()


router.get('/web_visit/:id', webVisitEngagement)
router.get('/call_us/:id', callUsEngagement)
router.post('/add_reaction', authenticate, addReactionEngagement)


export default router