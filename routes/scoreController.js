const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Score = require('../models/Score');
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

        const score = new Score({
            match_id,
            over_number,
            balls_per_over,
            bowler_id,
            balls: JSON.parse(balls) 
        });

        await score.save();
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
