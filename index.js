require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const json2csv = require('json2csv').parse;
const fs = require('fs');

const app = express();
app.use(express.json());

const allowedOrigins = '*';
app.use(cors({
    origin: allowedOrigins,
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
}));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

mongoose.connect(process.env.DATABASE_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Database connection failure"));
db.once("open", () => {
    console.log("Database connection success");
});

const subscriberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    }
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

app.get('/subscribers', async (req, res) => {
    try {
        const subscribers = await Subscriber.find({});
        res.status(200).json(subscribers);
    } catch (error) {
        res.status(500).json('Failed to fetch subscribers');
        console.error(error, 'Failed to fetch subscribers');
    }
});

app.post('/subscribe', async (req, res) => {
    try {
        const { name, email } = req.body;

        const existingSubscriber = await Subscriber.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).json('Email already exists');
        }

        const newSubscriber = new Subscriber({
            name,
            email
        });

        await newSubscriber.save();

        res.status(201).json('Subscriber created successfully');
    } catch (error) {
        res.status(500).json('Failed to create subscriber');
        console.error(error, 'Failed to create subscriber');
    }
});

app.delete('/subscribers', async (req, res) => {
    try {
        await Subscriber.deleteMany({});
        res.status(200).json('All subscribers deleted successfully');
    } catch (error) {
        res.status(500).json('Failed to delete subscribers');
        console.error(error, 'Failed to delete subscribers');
    }
});

app.delete('/subscribers/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const deletedUser = await Subscriber.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json('User not found');
        }
        res.status(200).json('User deleted successfully');
    } catch (error) {
        res.status(500).json('Failed to delete user');
        console.error(error, 'Failed to delete user');
    }
});

app.get('/export-subscribers', async (req, res) => {
    try {
        const subscribers = await Subscriber.find({});

        const fields = ['name', 'email'];
        const csv = json2csv(subscribers, { fields });

        const filename = 'subscribers.csv';

        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.set('Content-Type', 'text/csv');
        
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json('Failed to export subscribers');
        console.error(error, 'Failed to export subscribers');
    }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running at port ${PORT}`);
});