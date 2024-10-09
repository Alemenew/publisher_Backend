import express from "express";
import authenticate from "../middleware/authenticationMiddleware.js";
import { createIndividualPost, createIndividualPostForWeb, savePostedAdForIndividual, savePostedAdForIndividualWeb } from "../controllers/postedAds/postedAdForIndividual.js";
import checkEmptyString from "../middleware/checkEmptyStringMiddleware.js";
import { getIndividualBalance } from "../controllers/account/account.js";
import { getAllIndividuals, getIndividual } from "../controllers/individuals/individuals.js";


const router = express.Router()

router.get('/', authenticate, getAllIndividuals)
router.post('/save_posted_ad_for_individual', authenticate, checkEmptyString, savePostedAdForIndividual)
router.post('/save_posted_ad_for_individual_web', authenticate, checkEmptyString, savePostedAdForIndividualWeb)

router.post('/individual_post/:id', authenticate, createIndividualPost)
router.post('/individual_post_for_web/:id', authenticate, createIndividualPostForWeb)


router.get('/:id', authenticate, getIndividual)



export default router