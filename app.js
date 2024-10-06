import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import { setUpDatabase, getDbConnection } from './database.js';

// Ensure the database is set up properly
setUpDatabase().catch((error) => {
    console.error("Error setting up the database:", error);
});

const app = express();
const port = 3000;

// Middleware is utility code that can access the request object and the response object
//
// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Use __filename and __dirname properly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to
// ...parse incoming requests with JSON payloads, based on body-parser. Makes parsed data available in req.body
app.use(express.json());

// extended: true option lets objects and arrays to be encoded into the URL-encoded format so they can be passed.
app.use(express.urlencoded({ extended: true }));


// Serve static files from the public directory
app.use(express.static(__dirname + '/public'));

// ... allows use of HTTP verbs PUT, DELETE. Looks for a _method query parameter in the request, overrides HTTP method so routing parameters (like meetingID) get to route handler.
app.use(methodOverride('_method'));

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

// Contact page route
app.get('/contact', (req, res) => {
    res.render('pages/contact', { title: 'Contact Us' });
});

//########################## Start CUD implementation######################
//admin route handler
app.get("/admin", async (req, res) => {
    try {
      const db = await getDbConnection();
      const rows = await db.all('SELECT * FROM meetings');
      res.render("pages/admin", { data: rows, title: "Administer Meetings", notification: true, message: "--------" });
    }
    catch (err) {
      console.error(err);
      res.status(404).send('An error occurred while getting the data to manage');
    }
  });

//route to create new meeting
app.post('/add_meeting', async(req,res)=>{
    const{topic, mandatory, dateTime, location, parking} = req.body;
    let is_mandatory = req.body.mandatory ? 1: 0;
    console.log(`IN ADD MTG - topic ${topic}, mandatory ${is_mandatory}, dateTime ${dateTime}, location ${location}, parking ${parking}`);

    try{
        const db = await getDbConnection();
        await db.run('INSERT INTO meetings (topic, mandatory, dateTime, location, parking) VALUES(?,?,?,?,?)', [topic, is_mandatory, dateTime, location, parking]);
        //redirect to home page
        res.redirect('/');
    }
    catch(err){
        console.error(err);
        res.status(500).send('An Error Occurred While Submitting The Form');
    }
});

// Delete function
app.delete('/delete/:id', async(req,res)=>{
    console.log('in app.delete -----');
   try{
    const db = await getDbConnection();
    await db.run('DELETE FROM meetings WHERE id = ?', req.params.id);
    res.redirect('/') // redirect to home page to show that item has been removed
   }
   catch(err){
    console.error(err);
    res.status(500).send('Error deleting item')
   } 
});

//edit route
app.get('/edit/:id', async(req,res)=>{
    const db = await getDbConnection();
    const sql = `SELECT * FROM meetings WHERE id = ?`;
    const row = await db.get(sql, req.params.id);
    console.log('in app.get for edit: ', row);
    res.render('pages/edit', {data: row, title: 'Change Meeting', notification: true, message: 'Meeting being Modified'});
});

app.post('/edit/:id', async(req,res)=>{
    const db = await getDbConnection();
    let{ topic, mandatory, datetime,location,parking} = req.body;
    let is_mandatory = mandatory == undefined ? 0 : 1;
    const sql = `UPDATE meetings SET topic = ?, mandatory = ?, dateTime = ?, location = ?, parking = ? WHERE id = ?`;
    await db.run(sql,[topic, is_mandatory, datetime, location, parking, req.params.id]);
    res.redirect('/'); //redirect to home route
})

// Start the server
app.listen(port, () => {
    console.log(`App is listening on port ${port}`);
});
