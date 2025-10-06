const express = require('express');
const {
  register,
  login,
  getMe,
  logout,
  verifyUser
} = require('../controllers/authController');

const router = express.Router();

const {protect}= require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login',login);
router.post('/verify', verifyUser);
router.get('/logout',logout);
router.get('/me',protect,getMe);
module.exports = router;