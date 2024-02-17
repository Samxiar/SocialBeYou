const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 3000;

// Initialize SQLite database
const db = new sqlite3.Database('database.db');

// Create users and tweets tables if not exists
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, email TEXT UNIQUE, password TEXT, profilePicture BLOB)");
    db.run("CREATE TABLE IF NOT EXISTS tweets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, tweet TEXT, FOREIGN KEY(user_id) REFERENCES users(id))");
});

// Session middleware
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Authorization middleware to check if the user is authenticated
function requireLogin(req, res, next) {
    if (req.session && req.session.userId) {
        return next(); // User is authenticated, proceed to the next middleware
    } else {
        res.redirect('/login'); // User is not authenticated, redirect to the login page
    }
}

// Routes

// Route to serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route to handle user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT id FROM users WHERE (username = ? OR email = ?) AND password = ?', [username, username, password], (err, row) => {
        if (err) {
            console.error(err.message);
            res.send('Error logging in');
        } else if (row) {
            req.session.userId = row.id; // Set session variable to indicate logged-in user
            res.redirect('/beyou'); // Redirect to beyou.html page
        } else {
            res.send('Invalid username/email or password');
        }
    });
});

// Route to serve the signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Route to handle user signup
app.post('/signup', upload.single('profilePicture'), (req, res) => {
    const { username, email, password } = req.body;
    const profilePictureData = req.file ? req.file.buffer : null;

    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO users (username, email, password, profilePicture) VALUES (?, ?, ?, ?)");
        stmt.run(username, email, password, profilePictureData, (err) => {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed: users.email')) {
                    console.error('Error: Email already exists');
                    res.send('Error: Email already exists');
                } else if (err.message.includes('UNIQUE constraint failed: users.username')) {
                    console.error('Error: Username already exists');
                    res.send('Error: Username already exists');
                } else {
                    console.error(err.message);
                    res.send('Error signing up');
                }
            } else {
                res.redirect('/login'); // Redirect to login page after successful signup
            }
        });
        stmt.finalize();
    });
});

// Route to handle user logout
app.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Error logging out');
        } else {
            // Redirect the user to the login page after successfully logging out
            res.redirect('/login');
        }
    });
});

// Route to serve the beyou.html page, protected by requireLogin middleware
app.get('/beyou', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'beyou.html'));
});

// Route to handle posting tweets
app.post('/tweet', requireLogin, (req, res) => {
    const { tweet } = req.body;
    const userId = req.session.userId;

    db.run("INSERT INTO tweets (user_id, tweet) VALUES (?, ?)", [userId, tweet], (err) => {
        if (err) {
            console.error(err.message);
            res.send('Error tweeting');
        } else {
            res.send('Tweet posted successfully');
        }
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
