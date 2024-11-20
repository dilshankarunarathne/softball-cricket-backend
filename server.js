require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./db');
const { updateMatchStatuses } = require('./utils/matchStatusUpdater');

app.use(cors()); 
app.use(express.json());

app.use('/uploads', express.static('public/uploads'));

app.use('/auth', require('./routes/authController'));
app.use('/admin', require('./routes/adminController'));
app.use('/matches', require('./routes/matchController'));
app.use('/teams', require('./routes/teamController'));
app.use('/score', require('./routes/scoreController'));
app.use('/player', require('./routes/playerController'));
app.use('/news', require('./routes/newsController'));
app.use('/notifications', require('./routes/notificationController'));

// Schedule the match status update to run automatically
setInterval(updateMatchStatuses, 20000);

app.listen(3000, () => console.log('Server started on port 3000'));
