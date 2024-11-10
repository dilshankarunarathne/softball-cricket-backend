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

router.post('/', authMiddleware, upload.none(), async (req, res) => {
    const { match_id, over_number, balls_per_over, bowler_id, balls } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'temp-admin') {
            return res.status(403).send('Only admins can set score details');
        }

        const parsedBalls = JSON.parse(balls);
        const score = new Score({
            match_id,
            over_number,
            balls_per_over,
            bowler_id,
            balls: parsedBalls
        });

        await score.save();

        // Update match and player statistics
        const match = await Match.findById(match_id);
        const bowler = await Player.findById(bowler_id);

        for (const ball of parsedBalls) {
            if (ball.result === 'wicket') {
                bowler.wickets_taken += 1;
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
                        batsman.runs_scored += runs;
                        await batsman.save();
                    }
                }
            }
        }

        bowler.overs_bowled += 1;
        await bowler.save();
        await match.save();

        res.sendStatus(201);
    } catch (error) {
        console.error('Error in POST /scores:', error);
        res.status(500).send('Internal server error');
    }
});

router.put('/:id', authMiddleware, upload.none(), async (req, res) => {
    const { match_id, over_number, balls_per_over, bowler_id, balls } = req.body;
    const token = req.headers.authorization.split(' ')[1];

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
        const oldBowler = await Player.findById(score.bowler_id);

        for (const ball of score.balls) {
            if (ball.result === 'wicket') {
                oldBowler.wickets_taken -= 1;
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
                        batsman.runs_scored -= runs;
                        await batsman.save();
                    }
                }
            }
        }

        oldBowler.overs_bowled -= 1;
        await oldBowler.save();
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
        const newBowler = await Player.findById(score.bowler_id);

        for (const ball of score.balls) {
            if (ball.result === 'wicket') {
                newBowler.wickets_taken += 1;
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
                        batsman.runs_scored += runs;
                        await batsman.save();
                    }
                }
            }
        }

        newBowler.overs_bowled += 1;
        await newBowler.save();
        await newMatch.save();

        res.send('Score updated successfully');
    } catch (error) {
        console.error('Error in PUT /scores/:id:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;