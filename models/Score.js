const mongoose = require('../db');

const BallSchema = new mongoose.Schema({
  result: { type: String, required: true }, // e.g., '1', '2', '4', '6', 'wicket', 'no ball', 'wide', 'dot', 'lbw'
  runs: { type: Number, default: 0 }, // Number of runs scored on this ball
  wicket: { type: String, default: '' }, // Who the wicket was
  runs_to: { type: String, default: '' } // To whom the runs should add up
});

const ScoreSchema = new mongoose.Schema({
  match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  over_number: { type: Number, required: true },
  balls_per_over: { type: Number, required: true, default: 6 },
  bowler_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  balls: [BallSchema]
});

module.exports = mongoose.model('Score', ScoreSchema);
