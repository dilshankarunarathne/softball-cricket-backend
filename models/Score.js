const mongoose = require('../db');

const BallSchema = new mongoose.Schema({
  result: { type: String, required: true }, // e.g., '1', '2', '4', '6', 'wicket', 'no ball', 'wide', 'dot', 'lbw'
  runs: { type: Number, default: 0 }, // Number of runs scored on this ball
  runs_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null } // To whom the runs should add up
});

const OverSchema = new mongoose.Schema({
  over_number: { type: Number, required: true },
  balls: [BallSchema]
});

const ScoreSchema = new mongoose.Schema({
  match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  balls_per_over: { type: Number, required: true, default: 6 },
  overs: [OverSchema]
});

module.exports = mongoose.model('Score', ScoreSchema);
