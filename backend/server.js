const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({burgers: [], orders: []}, null, 2));
    }
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Get all burgers
app.get('/burgers', (req, res) => {
    const db = readDB();
    res.json(db.burgers);
});

// Get single burger
app.get('/burgers/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const burger = db.burgers.find(b => b.id === id);
    if (!burger) return res.status(404).json({error: 'Not found'});
    res.json(burger);
});

// Add a burger
app.post('/burgers', (req, res) => {
    const db = readDB();
    const newBurger = {
        id: db.burgers.length ? Math.max(...db.burgers.map(b => b.id)) + 1 : 1,
        name: req.body.name,
        price: req.body.price,
        toppings: req.body.toppings || []
    };
    db.burgers.push(newBurger);
    writeDB(db);
    res.json(newBurger);
});

// Edit a burger
app.put('/burgers/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const idx = db.burgers.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({error: 'Not found'});
    db.burgers[idx] = {
        id,
        name: req.body.name,
        price: req.body.price,
        toppings: req.body.toppings || []
    };
    writeDB(db);
    res.json(db.burgers[idx]);
});

// Delete a burger
app.delete('/burgers/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.burgers = db.burgers.filter(b => b.id !== id);
    writeDB(db);
    res.json({ message: 'Deleted' });
});

// Orders
app.post('/orders', (req, res) => {
    const db = readDB();
    const newOrder = {
        id: db.orders.length ? Math.max(...db.orders.map(o => o.id)) + 1 : 1,
        items: req.body.items || [],
        total: req.body.total || 0,
        customer: req.body.customer || {},
        createdAt: new Date().toISOString()
    };
    db.orders.push(newOrder);
    writeDB(db);
    res.json(newOrder);
});

app.get('/orders', (req, res) => {
    const db = readDB();
    res.json(db.orders);
});

app.listen(3000, () => console.log('Backend running on http://localhost:3000'));
