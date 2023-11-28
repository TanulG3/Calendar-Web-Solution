const express = require('express');
const Datastore = require('nedb');
const crypto = require('crypto');
const app = express();

app.use(express.static('public')); // Serve static files from 'public' directory
app.use(express.json()); // Middleware to parse JSON bodies

// Initialize NeDB databases
const db = new Datastore({ filename: 'events.db', autoload: true });
const permissionsDb = new Datastore({ filename: 'permissions.db', autoload: true });

// Session expiration time in milliseconds (30 minutes)
const sessionExpirationTime = 30 * 60 * 1000;

// Middleware to check for a valid and non-expired session
const checkSession = (req, res, next) => {
    const sessionId = req.headers['session-id'];
    if (!sessionId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    permissionsDb.findOne({ sessionId }, (err, user) => {
        if (err || !user || (user.expiration && user.expiration < Date.now())) {
            return res.status(401).json({ message: 'Invalid or expired session' });
        }
        next();
    });
};

// API endpoint to store events (protected)
app.post('/api/events', checkSession, (req, res) => {
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

// API endpoint to delete an event (protected)
app.delete('/api/events/:id', checkSession, (req, res) => {
    db.remove({ _id: req.params.id }, {}, (err, numRemoved) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.sendStatus(200);
        }
    });
});

// API endpoint to update an event (protected)
app.put('/api/events/:id', checkSession, (req, res) => {
    db.update({ _id: req.params.id }, { $set: req.body }, {}, (err, numReplaced) => {
        if (err) {
            res.status(500).send({ error: err.message });
        } else {
            res.status(200).json({ message: 'Event updated successfully' });
        }
    });
});

// API endpoint for user login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    permissionsDb.findOne({ username, password }, (err, doc) => {
        if (err) {
            res.status(500).send(err);
        } else if (doc) {
            const sessionId = crypto.randomBytes(16).toString('hex');
            const expiration = Date.now() + sessionExpirationTime;
            permissionsDb.update({ username }, { $set: { sessionId, expiration } }, {}, (err) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).json({ message: 'Login successful', sessionId });
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

app.post('/api/logout', (req, res) => {
    const { sessionId } = req.body;
    if (sessionId) {
        permissionsDb.update({ sessionId }, { $unset: { sessionId: 1, expiration: 1 } }, {}, (err) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).json({ message: 'Logged out successfully' });
            }
        });
    } else {
        res.status(400).json({ message: 'No session ID provided' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
