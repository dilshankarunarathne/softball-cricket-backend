const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Score = require('../models/Score');
const Match = require('../models/Match');
const Player = require('../models/Player');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');

// Endpoint to create a match-scoring entity
router.post('/create', authMiddleware, upload.none(), async (req, res) => {
    const { match_id, balls_per_over } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    if (!mongoose.Types.ObjectId.isValid(match_id)) {
        return res.status(400).send('Invalid match_id');
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'temp-admin') {
            return res.status(403).send('Only admins can create match-scoring entities');
        }

        const score = new Score({
            match_id,
            balls_per_over,
            overs: []
        });

        await score.save();
        res.status(201).send('Match-scoring entity created successfully');
    } catch (error) {
        console.error('Error in POST /create:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint to add ball-by-ball scoring
router.post('/add-ball', authMiddleware, upload.none(), async (req, res) => {
    const { match_id, over_number, bowler_id, ball } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    if (!mongoose.Types.ObjectId.isValid(match_id)) {
        return res.status(400).send('Invalid match_id');
    }
    if (!mongoose.Types.ObjectId.isValid(bowler_id)) {
        return res.status(400).send('Invalid bowler_id');
    }
    if (!ball || !ball.result) {
        return res.status(400).send('Invalid ball data');
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'temp-admin') {
            return res.status(403).send('Only admins can add ball-by-ball scoring');
        }

        const score = await Score.findOne({ match_id });
        if (!score) {
            return res.status(404).send('Match-scoring entity not found');
        }

        let over = score.overs.find(o => o.over_number === over_number);
        if (!over) {
            over = { over_number, balls: [] };
            score.overs.push(over);
        }

        over.balls.push(ball);
        await score.save();

        // Update match statistics
        const match = await Match.findById(match_id);
        const bowler = await Player.findById(bowler_id);

        if (ball.result === 'wicket') {
            if (match.team1 === bowler.team) {
                match.team2_wickets += 1;
            } else {
                match.team1_wickets += 1;
            }
        } else {
            const runs = ball.runs || 0;
            if (match.team1 === bowler.team) {
                match.team2_score += runs;
            } else {
                match.team1_score += runs;
            }
            if (ball.runs_to && mongoose.Types.ObjectId.isValid(ball.runs_to)) {
                const batsman = await Player.findById(ball.runs_to);
                if (batsman) {
                    // Update match-specific batsman statistics
                    const batsmanStats = match.player_stats.id(ball.runs_to) || { player_id: ball.runs_to, runs_scored: 0 };
                    batsmanStats.runs_scored += runs;
                    if (!match.player_stats.id(ball.runs_to)) {
                        match.player_stats.push(batsmanStats);
                    }
                }
            }
        }

        // Update match-specific bowler statistics
        const bowlerStats = match.player_stats.id(bowler_id) || { player_id: bowler_id, wickets_taken: 0, overs_bowled: 0 };
        bowlerStats.overs_bowled += 1;
        if (!match.player_stats.id(bowler_id)) {
            match.player_stats.push(bowlerStats);
        }
        await match.save();

        res.status(201).send('Ball added successfully');
    } catch (error) {
        console.error('Error in POST /add-ball:', error);
        res.status(500).send('Internal server error');
    }
});

router.put('/:id', authMiddleware, upload.none(), async (req, res) => {
    const { match_id, over_number, balls_per_over, bowler_id, balls } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    if (!mongoose.Types.ObjectId.isValid(match_id)) {
        return res.status(400).send('Invalid match_id');
    }
    if (!mongoose.Types.ObjectId.isValid(bowler_id)) {
        return res.status(400).send('Invalid bowler_id');
    }
    if (!Array.isArray(JSON.parse(balls))) {
        return res.status(400).send('Invalid balls format');
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'temp-admin') {
            return res.status(403).send('Only admins can update score details');
        }

        const score = await Score.findById(req.params.id);
        if (!score) {
            return res.status(404).send('Score not found');
        }

        // Revert old statistics
        const oldMatch = await Match.findById(score.match_id);
        const oldBowler = await Player.findById(score.bowler_id); // Add this line to fetch the old bowler

        for (const ball of score.balls) {
            if (ball.result === 'wicket') {
                if (oldMatch.team1 === oldBowler.team) {
                    oldMatch.team2_wickets -= 1;
                } else {
                    oldMatch.team1_wickets -= 1;
                }
            } else {
                const runs = ball.runs || 0;
                if (oldMatch.team1 === oldBowler.team) {
                    oldMatch.team2_score -= runs;
                } else {
                    oldMatch.team1_score -= runs;
                }
                if (ball.runs_to && mongoose.Types.ObjectId.isValid(ball.runs_to)) {
                    const batsman = await Player.findById(ball.runs_to);
                    if (batsman) {
                        // Revert match-specific batsman statistics
                        const batsmanStats = oldMatch.player_stats.id(ball.runs_to);
                        if (batsmanStats) {
                            batsmanStats.runs_scored -= runs;
                        }
                    }
                }
            }
        }

        // Revert match-specific bowler statistics
        const oldBowlerStats = oldMatch.player_stats.id(score.bowler_id);
        if (oldBowlerStats) {
            oldBowlerStats.overs_bowled -= 1;
        }
        await oldMatch.save();

        // Update score with new values
        score.match_id = match_id || score.match_id;
        score.over_number = over_number || score.over_number;
        score.balls_per_over = balls_per_over || score.balls_per_over;
        score.bowler_id = bowler_id || score.bowler_id;
        score.balls = balls ? JSON.parse(balls) : score.balls;

        await score.save();

        // Update new statistics
        const newMatch = await Match.findById(score.match_id);
        const newBowler = await Player.findById(score.bowler_id); // Add this line to fetch the new bowler

        for (const ball of score.balls) {
            if (ball.result === 'wicket') {
                if (newMatch.team1 === newBowler.team) {
                    newMatch.team2_wickets += 1;
                } else {
                    newMatch.team1_wickets += 1;
                }
            } else {
                const runs = ball.runs || 0;
                if (newMatch.team1 === newBowler.team) {
                    newMatch.team2_score += runs;
                } else {
                    newMatch.team1_score += runs;
                }
                if (ball.runs_to && mongoose.Types.ObjectId.isValid(ball.runs_to)) {
                    const batsman = await Player.findById(ball.runs_to);
                    if (batsman) {
                        // Update match-specific batsman statistics
                        const batsmanStats = newMatch.player_stats.id(ball.runs_to) || { player_id: ball.runs_to, runs_scored: 0 };
                        batsmanStats.runs_scored += runs;
                        if (!newMatch.player_stats.id(ball.runs_to)) {
                            newMatch.player_stats.push(batsmanStats);
                        }
                    }
                }
            }
        }

        // Update match-specific bowler statistics
        const newBowlerStats = newMatch.player_stats.id(score.bowler_id) || { player_id: score.bowler_id, wickets_taken: 0, overs_bowled: 0 };
        newBowlerStats.overs_bowled += 1;
        if (!newMatch.player_stats.id(score.bowler_id)) {
            newMatch.player_stats.push(newBowlerStats);
        }
        await newMatch.save();

        res.send('Score updated successfully');
    } catch (error) {
        console.error('Error in PUT /scores/:id:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
