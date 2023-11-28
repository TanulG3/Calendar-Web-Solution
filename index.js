const express = require('express');
const Datastore = require('nedb');
const app = express();
const crypto = require('crypto');

app.use(express.static('public')); // Serve static files from 'public' directory
app.use(express.json()); // Middleware to parse JSON bodies

// Initialize NeDB database
const db = new Datastore({ filename: 'events.db', autoload: true });
const permissionsDb = new Datastore({ filename: 'permissions.db', autoload: true });

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

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    permissionsDb.findOne({ username, password }, (err, doc) => {
        if (err) {
            res.status(500).send(err);
        } else if (doc) {
            // Generate a random session ID
            const sessionId = crypto.randomBytes(16).toString('hex');
            // Store session information
            permissionsDb.update({ username }, { $set: { sessionId } }, {}, (err, numUpdated) => {
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

// const commonPassword = "MstrPwd123"; // Common password for all users
// const hubs = ["DHKL", "DHM", "DHN", "DHMV", "DHT", "HQ"]; // List of HUBs

// // Generate user objects with usernames and common password
// const users = hubs.map(hub => {
//     return {
//         username: `${hub}@em1`,
//         password: commonPassword // In real applications, passwords should be hashed
//     };
// });

// // Function to insert users
// function initializeUsers() {
//     // Remove all existing users (optional, based on your requirement)
//     permissionsDb.remove({}, { multi: true }, function (err, numRemoved) {
//         // Insert new users
//         permissionsDb.insert(users, function (err, newDocs) {
//             if (err) {
//                 console.error("Error inserting users:", err);
//             } else {
//                 console.log("Added users:", newDocs.length);
//             }
//         });
//     });
// }

// // Call the function to initialize users
// initializeUsers();

// app.post('/api/login', (req, res) => {
//     const { username, password } = req.body;

//     permissionsDb.findOne({ username: username }, (err, user) => {
//         if (err) {
//             res.status(500).send("Error accessing the database");
//         } else if (user && user.password === password) {
//             res.status(200).json({ message: 'Login successful' });
//         } else {
//             res.status(401).json({ message: 'Invalid credentials' });
//         }
//     });
// });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
