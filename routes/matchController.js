const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, async (req, res) => {
    const { team1, team2, date, start_time, end_time, location } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can create matches');
        }

        const match = new Match({ team1, team2, date, start_time, end_time, location });
        await match.save();
        res.sendStatus(201);
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

router.get('/', async (req, res) => {
    const matches = await Match.find();
    res.send(matches);
});

module.exports = router;
