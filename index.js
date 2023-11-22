const express = require('express');
const Datastore = require('nedb');
const app = express();

app.use(express.static('public')); // Serve static files from 'public' directory
app.use(express.json()); // Middleware to parse JSON bodies

// Initialize NeDB database
const db = new Datastore({ filename: 'events.db', autoload: true });

// API endpoint to store events
app.post('/api/events', (req, res) => {
    const event = req.body;
    db.insert(event, (err, newDoc) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).json(newDoc);
        }
    });
});

// API endpoint to retrieve events
app.get('/api/events', (req, res) => {
    db.find({}, (err, docs) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).json(docs);
        }
    });
});

// API endpoint to delete an event
app.delete('/api/events/:id', (req, res) => {
    db.remove({ _id: req.params.id }, {}, (err, numRemoved) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.sendStatus(200);
        }
    });
});

// API endpoint to update an event
app.put('/api/events/:id', (req, res) => {
    db.update({ _id: req.params.id }, { $set: { eventName: req.body.eventName, eventHub: req.body.eventHub }}, {}, (err, numReplaced) => {
        if (err) {
            res.status(500).send({ error: err.message });
        } else {
            res.status(200).json({ message: 'Event updated successfully' });
        }
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
