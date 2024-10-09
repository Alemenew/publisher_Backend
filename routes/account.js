import express from "express";
import authenticate from "../middleware/authenticationMiddleware.js";
import { getIndividualAccountLog, getIndividualBalance } from "../controllers/account/account.js";
import { approveWithdrawalRequest, createWithdrawalRequest, getAllWithdrawalRequests, getIndividualWithdrawalRequests } from "../controllers/account/withdrawalRequest.js";
import checkEmptyString from "../middleware/checkEmptyStringMiddleware.js";


const router = express.Router()

router.get('/withdrawal_request', authenticate, getAllWithdrawalRequests)
router.post('/withdrawal_request', authenticate, checkEmptyString, createWithdrawalRequest)

router.get('/withdrawal_request/:id', authenticate, getIndividualWithdrawalRequests)
router.patch('/withdrawal_request/:id', authenticate, approveWithdrawalRequest)



router.get('/balance/:id', authenticate, getIndividualBalance)
router.get('/account_log/:id', authenticate, getIndividualAccountLog)

export default router