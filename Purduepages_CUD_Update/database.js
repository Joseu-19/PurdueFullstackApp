import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const setUpDatabase = () => {
    return open({
        filename: './public/database/meetings.db',
        driver: sqlite3.Database
    }).then(db => {
        return db.exec(`
            CREATE TABLE IF NOT EXISTS meetings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT,
                mandatory BOOLEAN,
                dateTime TEXT,
                location TEXT,
                parking TEXT
            )
        `).then(() => {
            console.log('Database schema set up.');
            // After setting up the schema, call populateDb to insert seed data if necessary
            return populateDb(db);
        });
    }).catch((error) => {
        console.error('Error setting up the database:', error);
    });
};

// Function to populate the database with seed data if the table is empty
export const populateDb = (db) => {
    return db.get('SELECT COUNT(*) AS count FROM meetings').then((row) => {
        if (row.count === 0) {
            // If there are no rows in the table, insert seed data
            return db.run(`
                INSERT INTO meetings (topic, mandatory, dateTime, location, parking)
                VALUES 
                    ('CIT Monthly Meeting', 1, 'September 24th 2024, 1pm-5pm', 'KNOY Hall West Lafayette', 'Park in the West Street Garage, 3rd floor. Venue opposite front entrance.'),
                    ('Research in Higher Level Ed', 0, 'October 5th 2024, 10am-12pm', 'Beresford Building, Room 2, Hall West Lafayette', 'Park in surface lot 300. Venue beside lot.'),
                    ('Curriculum Planning', 1, 'October 19th 2024, 4pm-6pm', 'IO240, Indianapolis', 'Park in North Street Garage, Michigan St. Venue opposite side of street, 300m North.')
            `).then(() => {
                console.log('Database populated with seed data.');
            });
        } else {
            // If the table already has data, skip inserting seed data
            console.log('Seed data already exists. Skipping population.');
        }
    }).catch((error) => {
        console.error('Error populating the database:', error);
    });
};

// Function to get a database connection (this can be used in other parts of your app)
export const getDbConnection = () => {
    return open({
        filename: './public/database/meetings.db',
        driver: sqlite3.Database
    }).catch((error) => {
        console.error('Error connecting to the database:', error);
    });
};
