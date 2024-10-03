import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { setUpDatabase, getDbConnection } from './database.js';

// Ensure the database is set up properly
setUpDatabase().catch((error) => {
    console.error("Error setting up the database:", error);
});

const app = express();
const port = 3000;

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use __filename and __dirname properly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the public directory
app.use(express.static(__dirname + '/public'));

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Route for home page
app.get('/', (req, res) => {
    getDbConnection()
        .then((db) => {
            return db.all('SELECT * FROM meetings');
        })
        .then((meetings) => {
            res.render('pages/index', {
                data: meetings,
                title: 'Scheduled Meetings'
            });
        })
        .catch((error) => {
            console.error("Error fetching meetings:", error);
            res.status(500).send('Internal Server Error');
        });
});

//##############Admin#####################
app.get("/admin", async (req, res) => {
    try {
        const db = await getDbConnection();
        const rows = await db.all('SELECT * FROM MEETINGS');
        res.render("pages/admin", {data: rows, title: 'Administrator Meetings', notification: true, message: "___________"});
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

//######### Edit meeting route #################
app.get('/edit/:id', async (req, res) => {
    const id = req.params.id; // Get the ID from the URL

    try {
        const db = await getDbConnection();
        const meeting = await db.get('SELECT * FROM meetings WHERE id = ?', [id]);

        if (!meeting) {
            res.status(404).send('Meeting not found');
            return;
        }

        // Render a form populated with the existing meeting data
        res.render('pages/edit', { meeting, title: 'Edit Meeting' });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while fetching the meeting');
    }
});

//############## Update route for handling edit form submission ####################

app.post('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const { topic, mandatory, dateTime, location, parking } = req.body;
    const is_mandatory = req.body.mandatory ? 1 : 0;

    try {
        const db = await getDbConnection();
        await db.run(
            'UPDATE meetings SET topic = ?, mandatory = ?, dateTime = ?, location = ?, parking = ? WHERE id = ?',
            [topic, is_mandatory, dateTime, location, parking, id]
        );

        res.redirect('/admin'); // Redirect to admin page after updating
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while updating the meeting');
    }
});

// Contact page route
app.get('/contact', (req, res) => {
    res.render('pages/contact', { title: 'Contact Us' });
});

// Start the server
app.listen(port, () => {
    console.log(`App is listening on port ${port}`);
});
