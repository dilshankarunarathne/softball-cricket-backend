const mongoose = require('../db');

const PlayerStatsSchema = new mongoose.Schema({
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  runs_scored: { type: Number, default: 0 },
  wickets_taken: { type: Number, default: 0 },
  overs_bowled: { type: Number, default: 0 }
});

const MatchSchema = new mongoose.Schema({
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  location: { type: String, required: true },

  halftime: { type: String, default: 'No' },
  wicket_out_players: { type: Array, default: [] },

  // result fields
  team1_score: { type: Number, default: 0 },
  team2_score: { type: Number, default: 0 },
  team1_wickets: { type: Number, default: 0 },
  team2_wickets: { type: Number, default: 0 },
  team1_overs_played: { type: Number, default: 0 },
  team2_overs_played: { type: Number, default: 0 },
  winner: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  toss_winner: { type: String, default: '' },
  bat_first: { type: String, default: '' },
  player_stats: [PlayerStatsSchema]
});

MatchSchema.statics.updateStatuses = async function() {
  const matches = await this.find();
  const currentDate = new Date().toDateString();

  matches.forEach(async (match) => {
    const matchDate = new Date(match.date).toDateString();

    if (currentDate === matchDate) {
      match.status = 'live';
    } else if (new Date() < new Date(match.date)) {
      match.status = 'ended';
    } else if (new Date() > new Date(match.date)) {
      match.status = 'ended';
    }

    await match.save();
  });
};

module.exports = mongoose.model('Match', MatchSchema);
