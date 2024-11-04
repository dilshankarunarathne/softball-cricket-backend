const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('multer');
const upload = multer();

router.post('/signup', upload.none(), async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword, user_type: 'user' });
  await user.save();
  res.sendStatus(201);
});

router.post('/login', upload.none(), async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user || !await bcrypt.compare(req.body.password, user.password)) {
    return res.sendStatus(401);
  }
  const token = jwt.sign({ _id: user._id, user_type:user.user_type }, process.env.SECRET_KEY);
  res.send({ token });
});

// TODO: add more fields to the user model for profile
router.get('/profile', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded._id);
    res.send(user);
  } catch (error) {
    res.sendStatus(403);
  }
});

router.put('/profile', upload.none(), async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded._id);
    // user.username = req.body.username;
    // TOOD: handle user account details
    await user.save();
    res.send('account updated successfully');
  } catch (error) {
    res.sendStatus(403);
  }
});

module.exports = router;
