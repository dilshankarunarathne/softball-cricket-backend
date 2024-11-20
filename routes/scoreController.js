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
    console.log('POST /create called'); // Add this line
    const { match_id, balls_per_over } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    if (!mongoose.Types.ObjectId.isValid(match_id)) {
        console.log('Invalid match_id'); // Add this line
        return res.status(400).send('Invalid match_id');
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        console.log('decoded data: ', decoded); // Add this line

        if (decoded.user_type !== 'temp-admin') {
            console.log('Unauthorized user'); // Add this line
            return res.status(403).send('Only admins can create match-scoring entities');
        }

        const existingScore = await Score.findOne({ match_id });
        if (existingScore) {
            console.log('Match-scoring entity already created'); // Add this line
            return res.status(400).send('Match-scoring entity already created');
        }

        const score = new Score({
            match_id,
            balls_per_over,
            overs: []
        });

        await score.save();
        console.log('Match-scoring entity created successfully'); // Add this line
        res.status(201).send('Match-scoring entity created successfully');
    } catch (error) {
        console.error('Error in POST /create:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint to save an over
router.post('/add-over', authMiddleware, upload.none(), async (req, res) => {
    console.log('POST /add-over called'); // Add this line
    const { match_id, over_number, bowler_id, balls } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    if (!mongoose.Types.ObjectId.isValid(match_id)) {
        console.log('Invalid match_id'); // Add this line
        return res.status(400).send('Invalid match_id');
    }
    if (!mongoose.Types.ObjectId.isValid(bowler_id)) {
        console.log('Invalid bowler_id'); // Add this line
        return res.status(400).send('Invalid bowler_id');
    }
    if (!Array.isArray(JSON.parse(balls))) {
        console.log('Invalid balls format'); // Add this line
        return res.status(400).send('Invalid balls format');
    }

    const ballsArray = JSON.parse(balls);
    for (const ball of ballsArray) {
        if (ball.result !== 'wicket' && ball.result !== 'none' && ball.result !== 'Extra Run' && ball.runs_to && !mongoose.Types.ObjectId.isValid(ball.runs_to)) {
            console.log('Invalid runs_to'); // Add this line
            return res.status(400).send('Invalid runs_to');
        }
        if (ball.runs_to === '') {
            ball.runs_to = null; // Convert empty string to null
        }
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'temp-admin') {
            console.log('Unauthorized user'); // Add this line
            return res.status(403).send('Only admins can save overs');
        }

        const score = await Score.findOne({ match_id });
        if (!score) {
            console.log('Match-scoring entity not found'); // Add this line
            return res.status(404).send('Match-scoring entity not found');
        }

        let over = score.overs.find(o => o.over_number === over_number);
        if (!over) {
            over = { over_number, balls: ballsArray };
            score.overs.push(over);
        } else {
            over.balls = ballsArray;
        }

        await score.save();
        console.log('Over saved successfully'); // Add this line

        // Update match statistics
        const match = await Match.findById(match_id);
        if (!match) {
            console.log('Match not found'); 
            return res.status(404).send('Match not found');
        }

        console.log('bowler_id:', bowler_id); 
        if (!mongoose.Types.ObjectId.isValid(bowler_id)) {
            console.log('Invalid bowler_id'); 
            return res.status(400).send('Invalid bowler_id');
        }

        // TODO BUG: bowler is not found by _id
        const bowler = await Player.findById(bowler_id); // Fix this line
        console.log('bowler:', bowler); 
        if (!bowler) {
            console.log('Bowler not found');
            return res.status(404).send('Bowler not found');
        }

        for (const ball of ballsArray) {
            if (ball.result === 'wicket') {
                if (match.team1 === bowler.team) {
                    match.team2_wickets += 1;
                } else {
                    match.team1_wickets += 1;
                }
            } else if (ball.result === 'Extra Run') {
                if (match.team1 === bowler.team) {
                    match.team2_score += 1;
                } else {
                    match.team1_score += 1;
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
        }

        // Update match-specific bowler statistics
        const bowlerStats = match.player_stats.id(bowler_id) || { player_id: bowler_id, wickets_taken: 0, overs_bowled: 0 };
        bowlerStats.overs_bowled += 1;
        if (!match.player_stats.id(bowler_id)) {
            match.player_stats.push(bowlerStats);
        }

        // Calculate and update total scores
        match.team1_score = match.player_stats.filter(p => match.team1_players?.includes(p.player_id)).reduce((acc, p) => acc + p.runs_scored, 0);
        match.team2_score = match.player_stats.filter(p => match.team2_players?.includes(p.player_id)).reduce((acc, p) => acc + p.runs_scored, 0);

        await match.save();

        res.status(201).send('Over added successfully');
    } catch (error) {
        console.error('Error in POST /add-over:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint to add ball-by-ball scoring
router.post('/add-ball', authMiddleware, upload.none(), async (req, res) => {
    console.log('POST /add-ball called'); // Add this line
    const { match_id, over_number, bowler_id, ball } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    if (!mongoose.Types.ObjectId.isValid(match_id)) {
        console.log('Invalid match_id'); // Add this line
        return res.status(400).send('Invalid match_id');
    }
    if (!mongoose.Types.ObjectId.isValid(bowler_id)) {
        console.log('Invalid bowler_id'); // Add this line
        return res.status(400).send('Invalid bowler_id');
    }
    if (!ball || !ball.result) {
        console.log('Invalid ball data'); // Add this line
        return res.status(400).send('Invalid ball data');
    }
    if (ball.result !== 'wicket' && ball.result !== 'none' && ball.result !== 'Extra Run' && ball.runs_to && !mongoose.Types.ObjectId.isValid(ball.runs_to)) {
        console.log('Invalid runs_to'); // Add this line
        return res.status(400).send('Invalid runs_to');
    }
    if (ball.runs_to === '') {
        ball.runs_to = null; // Convert empty string to null
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'temp-admin') {
            console.log('Unauthorized user'); // Add this line
            return res.status(403).send('Only admins can add ball-by-ball scoring');
        }

        const score = await Score.findOne({ match_id });
        if (!score) {
            console.log('Match-scoring entity not found'); // Add this line
            return res.status(404).send('Match-scoring entity not found');
        }

        let over = score.overs.find(o => o.over_number === over_number);
        if (!over) {
            over = { over_number, balls: [] };
            score.overs.push(over);
        }

        over.balls.push(ball);
        await score.save();
        console.log('Ball added successfully'); // Add this line

        // Update match statistics
        const match = await Match.findById(match_id);
        const bowler = await Player.findById(bowler_id);

        if (ball.result === 'wicket') {
            if (match.team1 === bowler.team) {
                match.team2_wickets += 1;
            } else {
                match.team1_wickets += 1;
            }
        } else if (ball.result === 'Extra Run') {
            if (match.team1 === bowler.team) {
                match.team2_score += 1;
            } else {
                match.team1_score += 1;
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

// Endpoint to fetch the current score for a match
router.get('/current/:match_id', authMiddleware, async (req, res) => {
    console.log('GET /current/:match_id called'); // Add this line
    const { match_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(match_id)) {
        console.log('Invalid match_id'); // Add this line
        return res.status(400).send('Invalid match_id');
    }

    try {
        const score = await Score.findOne({ match_id });
        if (!score) {
            console.log('Match-scoring entity not found'); // Add this line
            return res.status(404).send('Match-scoring entity not found');
        }

        const match = await Match.findById(match_id);
        if (!match) {
            console.log('Match not found'); // Add this line
            return res.status(404).send('Match not found');
        }

        const response = {
            team1_score: match.team1_score,
            team2_score: match.team2_score,
            team1_wickets: match.team1_wickets,
            team2_wickets: match.team2_wickets,
            overs: score.overs
        };

        console.log('Current score fetched successfully'); // Add this line
        res.status(200).json(response);
    } catch (error) {
        console.error('Error in GET /current/:match_id:', error);
        res.status(500).send('Internal server error');
    }
});

router.put('/:id', authMiddleware, upload.none(), async (req, res) => {
    console.log('PUT /:id called'); // Add this line
    const { match_id, over_number, balls_per_over, bowler_id, balls } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    if (!mongoose.Types.ObjectId.isValid(match_id)) {
        console.log('Invalid match_id'); // Add this line
        return res.status(400).send('Invalid match_id');
    }
    if (!mongoose.Types.ObjectId.isValid(bowler_id)) {
        console.log('Invalid bowler_id'); // Add this line
        return res.status(400).send('Invalid bowler_id');
    }
    if (!Array.isArray(JSON.parse(balls))) {
        console.log('Invalid balls format'); // Add this line
        return res.status(400).send('Invalid balls format');
    }

    const ballsArray = JSON.parse(balls);
    for (const ball of ballsArray) {
        if (ball.result !== 'wicket' && ball.result !== 'none' && ball.result !== 'Extra Run' && ball.runs_to && !mongoose.Types.ObjectId.isValid(ball.runs_to)) {
            console.log('Invalid runs_to'); // Add this line
            return res.status(400).send('Invalid runs_to');
        }
        if (ball.runs_to === '') {
            ball.runs_to = null; // Convert empty string to null
        }
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'temp-admin') {
            console.log('Unauthorized user'); // Add this line
            return res.status(403).send('Only admins can update score details');
        }

        const score = await Score.findById(req.params.id);
        if (!score) {
            console.log('Score not found'); // Add this line
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
            } else if (ball.result === 'Extra Run') {
                if (oldMatch.team1 === oldBowler.team) {
                    oldMatch.team2_score -= 1;
                } else {
                    oldMatch.team1_score -= 1;
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
        score.balls = ballsArray;

        await score.save();
        console.log('Score updated successfully'); // Add this line

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
            } else if (ball.result === 'Extra Run') {
                if (newMatch.team1 === newBowler.team) {
                    newMatch.team2_score += 1;
                } else {
                    newMatch.team1_score += 1;
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
