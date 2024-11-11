const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new notification (for testing purposes, not used in production)
router.post('/', authMiddleware, async (req, res) => {
  const { message } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (decoded.user_type !== 'admin') {
      return res.status(403).send('Only admins can create notifications');
    }

    const notification = new Notification({ message });
    await notification.save();
    res.status(201).send('Notification created successfully');
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

// Get all notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.send(notifications);
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

// Get a notification by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).send('Notification not found');
    }
    res.send(notification);
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

// Delete a notification by ID
router.delete('/:id', authMiddleware, async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (decoded.user_type !== 'admin') {
      return res.status(403).send('Only admins can delete notifications');
    }

    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).send('Notification not found');
    }

    res.send('Notification deleted successfully');
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

// Mark a notification as read by a user
router.put('/:id/mark-as-read', authMiddleware, async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decoded.user_id;

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).send('Notification not found');
    }

    if (!notification.seen_by.includes(userId)) {
      notification.seen_by.push(userId);
      await notification.save();
    }

    res.send('Notification marked as read');
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
