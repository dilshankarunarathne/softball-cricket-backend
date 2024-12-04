const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Player = require('../models/Player');
const Match = require('../models/Match'); // Add this line
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, upload.none(), async (req, res) => {
    const { name, team, batting_style, bowling_style, phone_number, email, date_of_birth, first_name, last_name, match_id } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    console.log(req.body);

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        console.log(decoded);

        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can create players');
        }

        const player = new Player({
            name: name || null,
            team: team || null,
            batting_style: batting_style || null,
            bowling_style: bowling_style || null,
            phone_number: phone_number || null,
            email: email || null,
            date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
            first_name: first_name || null,
            last_name: last_name || null,
            match_id: match_id || null // Add this line
        });
        await player.save();
        res.status(201).send('Player created successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

// Get players by match ID
router.get('/match/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        
        // get the two team ids for that match
        const match = await Match.findById (matchId);
        if (!match) {
            return res.status(404).send('Match not found');
        }
        const team1 = match.team1;
        const team2 = match.team2;

        // get all players for those two teams
        const players = await Player.find({ $or: [{ team: team1 }, { team: team2 }] });      

        if (players.length === 0) {
            console.log(`No players found for match ID: ${matchId}`);
        }
        res.send(players);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

router.get('/all', async (req, res) => {
    try {
        const players = await Player.find();
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

router.put('/:id', authMiddleware, upload.none(), async (req, res) => {
    const { name, team, runs_scored, wickets_taken, overs_bowled, batting_style, bowling_style, phone_number, email, date_of_birth, first_name, last_name } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    console.log("update player called : ", req.body);

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        // console.log("--- decoded user: ", decoded);
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
        player.batting_style = batting_style || player.batting_style;
        player.bowling_style = bowling_style || player.bowling_style;
        player.phone_number = phone_number || player.phone_number;
        player.email = email || player.email;
        player.date_of_birth = date_of_birth ? new Date(date_of_birth) : player.date_of_birth;
        player.first_name = first_name || player.first_name;
        player.last_name = last_name || player.last_name;

        await player.save();
        res.send(player);
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
