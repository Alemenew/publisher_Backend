import express from 'express'
import { createUser, getUsers, checkemail, updateUser, getUser, getUserType, loginUser } from '../controllers/users.js'
import authenticate from '../middleware/authenticationMiddleware.js'
import { sendContactFormEmail } from '../controllers/contactusmail.js'
import { UsersDetailUpdate } from '../controllers/userData/userDetail.js'
const router = express.Router()
router.post('/emailChecker', checkemail)
// router.get('/', authenticate, getUsers)
router.post('/', createUser)
router.post('/login', loginUser)
router.post('/send-contact', sendContactFormEmail);

router.get('/get_user_type/:id', authenticate, getUserType)
router.get('/:id', authenticate, getUser)
router.patch('/:id', updateUser)
router.patch('/usersDetailUpdate', UsersDetailUpdate);

export default router
