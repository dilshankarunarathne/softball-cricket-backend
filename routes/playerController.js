const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Player = require('../models/Player');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');

// Create a new player
router.post('/', authMiddleware, upload.none(), async (req, res) => {
    const { name, team } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can create players');
        }

        const player = new Player({ name, team });
        await player.save();
        res.status(201).send('Player created successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

// TODO bug - Get all players
router.get('/', async (req, res) => {
    try {
        const players = await Player.find();
        console.log('=============' + players);
        res.send(players);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

// Get a player by ID
router.get('/:id', async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) {
            return res.status(404).send('Player not found');
        }
        res.send(player);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

// Update a player by ID
router.put('/:id', authMiddleware, upload.none(), async (req, res) => {
    const { name, team, runs_scored, wickets_taken, overs_bowled } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can update players');
        }

        const player = await Player.findById(req.params.id);
        if (!player) {
            return res.status(404).send('Player not found');
        }

        player.name = name || player.name;
        player.team = team || player.team;
        player.runs_scored = runs_scored !== undefined ? runs_scored : player.runs_scored;
        player.wickets_taken = wickets_taken !== undefined ? wickets_taken : player.wickets_taken;
        player.overs_bowled = overs_bowled !== undefined ? overs_bowled : player.overs_bowled;

        await player.save();
        res.send('Player updated successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

// Delete a player by ID
router.delete('/:id', authMiddleware, upload.none(), async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can delete players');
        }

        const player = await Player.findByIdAndDelete(req.params.id);
        if (!player) {
            return res.status(404).send('Player not found');
        }

        res.send('Player deleted successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
