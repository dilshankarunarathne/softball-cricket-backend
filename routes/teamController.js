const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Team = require('../models/Team');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, upload.none(), async (req, res) => {
    const { name } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can create teams');
        }

        const team = new Team({ name });
        await team.save();
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
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

router.put('/:id', authMiddleware, upload.none(), async (req, res) => {
    const { name } = req.body;
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

        team.name = name;
        await team.save();

        res.send('Team updated successfully');
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

router.delete('/:id', authMiddleware, upload.none(), async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can delete teams');
        }

        const team = await Team.findByIdAndDelete(req.params.id);
        if (!team) {
            return res.status(404).send('Team not found');
        }

        res.send('Team deleted successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
