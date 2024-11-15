const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');
const TARequest = require('../models/TARequest');

router.post('/change-user-type', authMiddleware, upload.none(), async (req, res) => {
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

router.post('/request-user-type-change', authMiddleware, upload.none(), async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const newRequest = new TARequest({
      username: user.username,
      user_id: user._id,
      requested_time: new Date()
    });

    await newRequest.save();
    res.send('User type change request submitted successfully');
  } catch (error) {
    res.status(500).send('Internal server error');
  }
});

router.get('/view-user-type-change-requests', authMiddleware, async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (decoded.user_type !== 'admin') {
      return res.status(403).send('Only admins can view user type change requests');
    }

    const requests = await TARequest.find();
    res.send(requests);
  } catch (error) {
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
