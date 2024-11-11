const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, upload.none(), async (req, res) => {
    const { team1, team2, date, start_time, end_time, location } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can create matches');
        } 

        const match = new Match({ team1, team2, date, start_time, end_time, location });
        await match.save();

        // Create a notification for the scheduled match
        const message = `A new match has been scheduled between ${team1} and ${team2} on ${date} at ${location}.`;
        const notification = new Notification({ message });
        await notification.save();

        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

router.get('/', async (req, res) => {
    try {
        const matches = await Match.find();
        res.send(matches);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) {
            return res.status(404).send('Match not found');
        }
        res.send(match);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

router.put('/:id', authMiddleware, upload.none(), async (req, res) => {
    const { team1, team2, date, start_time, end_time, location } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can update matches');
        }

        const match = await Match.findById(req.params.id);
        if (!match) {
            return res.status(404).send('Match not found');
        }

        match.team1 = team1;
        match.team2 = team2;
        match.date = date;
        match.start_time = start_time;
        match.end_time = end_time;
        match.location = location;
        await match.save();

        res.send('Match updated successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

router.delete('/:id', authMiddleware, upload.none(), async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can delete matches');
        }

        const match = await Match.findByIdAndDelete(req.params.id);
        if (!match) {
            return res.status(404).send('Match not found');
        }

        res.send('Match deleted successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
