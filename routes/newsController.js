const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const News = require('../models/News');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');

// Create a new news item
router.post('/', authMiddleware, upload.none(), async (req, res) => {
    const { image, description } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can create news items');
        }

        const news = new News({ image, description });
        await news.save();
        res.status(201).send('News item created successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

// Get all news items
router.get('/', async (req, res) => {
    try {
        const newsItems = await News.find();
        res.send(newsItems);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

// Get a news item by ID
router.get('/:id', async (req, res) => {
    try {
        const newsItem = await News.findById(req.params.id);
        if (!newsItem) {
            return res.status(404).send('News item not found');
        }
        res.send(newsItem);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

// Update a news item by ID
router.put('/:id', authMiddleware, upload.none(), async (req, res) => {
    const { image, description } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can update news items');
        }

        const newsItem = await News.findById(req.params.id);
        if (!newsItem) {
            return res.status(404).send('News item not found');
        }

        newsItem.image = image || newsItem.image;
        newsItem.description = description || newsItem.description;
        await newsItem.save();

        res.send('News item updated successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

// Delete a news item by ID
router.delete('/:id', authMiddleware, upload.none(), async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can delete news items');
        }

        const newsItem = await News.findByIdAndDelete(req.params.id);
        if (!newsItem) {
            return res.status(404).send('News item not found');
        }

        res.send('News item deleted successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
