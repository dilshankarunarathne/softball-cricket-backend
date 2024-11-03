const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/change-user-type', authMiddleware, async (req, res) => {
  const { username, new_type } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (decoded.user_type !== 'admin') {
      return res.status(403).send('Only admins can change user types');
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send('User not found');
    }

    user.user_type = new_type;
    await user.save();

    res.send('User type updated successfully');
  } catch (error) {
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
