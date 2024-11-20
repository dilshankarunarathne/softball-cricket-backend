const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const News = require('../models/News');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Create a new news item
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    const { description } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can create news items');
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
        const news = new News({ image: imageUrl || undefined, description });
        await news.save();
        res.status(201).send('News item created successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

// Get all news items
router.get('/', async (req, res) => {
    console.log('GET /news');
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
    console.log(`GET /news/${req.params.id}`);
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
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    const { description } = req.body;
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

        if (req.file) {
            const imageUrl = `/uploads/${req.file.filename}`;
            newsItem.image = imageUrl;
        }
        newsItem.description = description || newsItem.description;
        await newsItem.save();

        res.send('News item updated successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
});

// Delete a news item by ID
router.delete('/:id', authMiddleware, async (req, res) => {
    console.log(`DELETE /news/${req.params.id}`);
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log('Decoded token:', decoded);
        if (decoded.user_type !== 'admin') {
            return res.status(403).send('Only admins can delete news items');
        }

        const newsItem = await News.findByIdAndDelete(req.params.id);
        if (!newsItem) {
            return res.status(404).send('News item not found');
        }

        console.log('News item deleted:', newsItem);
        res.send('News item deleted successfully');
    } catch (error) {
        console.log('Error in DELETE /news/:id:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
