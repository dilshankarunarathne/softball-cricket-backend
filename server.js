require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./db');

app.use(cors()); 
app.use(express.json());

app.use('/auth', require('./routes/authController'));
app.use('/admin', require('./routes/adminController'));
app.use('/matches', require('./routes/matchController'));
app.use('/teams', require('./routes/teamController'));
app.use('/score', require('./routes/scoreController'));

app.listen(3000, () => console.log('Server started on port 3000'));
