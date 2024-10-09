import express from "express"
import { createCompany, getCompanies, getCompany, loginCompany, updateCompany, updateCompanyPassword } from "../controllers/company/company.js"
import authenticate from "../middleware/authenticationMiddleware.js"
import checkEmptyString from "../middleware/checkEmptyStringMiddleware.js"


const router = express.Router()

router.get("/", authenticate, getCompanies)
router.post("/", authenticate, checkEmptyString, createCompany)

router.post("/login", checkEmptyString, loginCompany)

router.patch("/update_password/:id", authenticate, checkEmptyString, updateCompanyPassword)
router.get("/:id", authenticate, getCompany)
router.patch("/:id", authenticate, checkEmptyString, updateCompany)


export default router