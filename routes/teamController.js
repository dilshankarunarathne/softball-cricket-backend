const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, async (req, res) => {
    const { team_name } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can create teams');
        }

        const team = new Team({ team_name });
        await team.save();
        res.sendStatus(201);
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

router.get('/', async (req, res) => {
    const teams = await Team.find();
    res.send(teams);
});

router.get('/:id', async (req, res) => {
    const team = await Team.findById(req.params.id);
    if (!team) {
        return res.status(404).send('Team not found');
    }
    res.send(team);
});

router.put('/:id', authMiddleware, async (req, res) => {
    const { team_name } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can update teams');
        }

        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).send('Team not found');
        }

        team.team_name = team_name;
        await team.save();

        res.send('Team updated successfully');
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
