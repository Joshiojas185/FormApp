const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql2 = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'codeup'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to MySQL Database');
});


app.get('/get-json-data/:tableName', (req, res) => {
    const tableName = req.params.tableName;

    // Query to fetch the JSON field and is_active status from the correct table
    const query = `SELECT json_data, is_active FROM ${tableName} WHERE id = 1`; // Adjust if needed

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching JSON:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        const { json_data, is_active } = results[0];

        // Check if the form is active
        if (!is_active) {
            return res.status(403).json({ error: 'This form is not live right now.' });
        }

        // Parse and send JSON data
        try {
            const jsonData = JSON.parse(json_data);
            res.json({ json_data: jsonData });
        } catch (parseError) {
            res.status(500).json({ error: 'Invalid JSON format in database' });
        }
    });
});


// Endpoint to create a new form
app.post('/create-form', (req, res) => {
    const { title, description, postscript, questions } = req.body; // Destructure new fields

    // Log the incoming request body
    console.log('Received data:', req.body);

    // Replace spaces in the table name with underscores
    const tableName = title.replace(/\s+/g, '_');
    const responseTableName = `${tableName}_responses`;

    // Check if questions exist and is an array
    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).send('No questions provided or questions is not an array.');
    }

    const responseColumns = questions.map(q => {
        if (!q.text) {
            throw new Error('Question text is missing');
        }
        return `\`${q.text.replace(/\s+/g, '_')}\` VARCHAR(255)`;
    }).join(', ');

    // Create the metadata table with an additional column 'is_active'
    const createMetadataTableQuery = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        json_data JSON NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
    );`;

    // Create the responses table
const createResponseTableQuery = `CREATE TABLE IF NOT EXISTS \`${responseTableName}\` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ${responseColumns}
);`;

    // Insert the JSON data into the metadata table
    const jsonData = JSON.stringify({ title, description, postscript, questions }); // Include new fields
    const insertJsonQuery = `INSERT INTO \`${tableName}\` (json_data) VALUES (?);`;

    // Execute the queries
    db.query(createMetadataTableQuery, (err) => {
        if (err) {
            console.error('Error creating metadata table:', err);
            return res.status(500).send(err);
        }
        
        db.query(createResponseTableQuery, (err) => {
            if (err) {
                console.error('Error creating response table:', err);
                return res.status(500).send(err);
            }
            
            db.query(insertJsonQuery, [jsonData], (err) => {
                if (err) {
                    console.error('Error inserting JSON data:', err);
                    return res.status(500).send(err);
                }
                res.send('Form created successfully with metadata and response tables!');
            });
        });
    });
});

app.get('/api/active-forms', (req, res) => {
    const getTablesQuery = `SHOW TABLES`;

    db.query(getTablesQuery, (err, tables) => {
        if (err) {
            console.error('Error fetching tables:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        const activeForms = [];
        let completedQueries = 0;

        tables.forEach((table) => {
            const tableName = Object.values(table)[0];

            const checkColumnsQuery = `SHOW COLUMNS FROM \`${tableName}\``;

            db.query(checkColumnsQuery, (err, columns) => {
                if (err) {
                    console.error(`Error fetching columns for table ${tableName}:`, err);
                    completedQueries++;
                    return;
                }

                const hasJsonData = columns.some(col => col.Field === 'json_data');
                const hasIsActive = columns.some(col => col.Field === 'is_active');

                if (hasJsonData && hasIsActive) {
                    const getFormsQuery = `SELECT json_data, is_active FROM \`${tableName}\``;

                    db.query(getFormsQuery, (err, results) => {
                        if (err) {
                            console.error(`Error fetching forms from table ${tableName}:`, err);
                        } else {
                            results.forEach(result => {
                                try {
                                    const jsonData = JSON.parse(result.json_data);
                                    activeForms.push({
                                        title: jsonData.title,
                                        isActive: result.is_active
                                    });
                                } catch (parseError) {
                                    console.error(`Error parsing JSON from table ${tableName}:`, parseError);
                                }
                            });
                        }
                        completedQueries++;
                        if (completedQueries === tables.length) {
                            res.json(activeForms);
                        }
                    });
                } else {
                    completedQueries++;
                    if (completedQueries === tables.length) {
                        res.json(activeForms);
                    }
                }
            });
        });
    });
});



// Endpoint to update the is_active status of a form
app.post('/api/update-form-status', (req, res) => {
    const { formTitle, isActive } = req.body; // Expecting formTitle and isActive in the request body

    // Step 1: Find the table that contains the formTitle
    const getTablesQuery = `SHOW TABLES`;

    db.query(getTablesQuery, (err, tables) => {
        if (err) {
            console.error('Error fetching tables:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        let completedQueries = 0;
        let found = false;

        // Step 2: Iterate through each table to find the form
        tables.forEach((table) => {
            const tableName = Object.values(table)[0]; // Get the table name

            // Step 3: Check if the table has the required columns
            const checkColumnsQuery = `SHOW COLUMNS FROM \`${tableName}\``;

            db.query(checkColumnsQuery, (err, columns) => {
                if (err) {
                    console.error(`Error fetching columns for table ${tableName}:`, err);
                    completedQueries++;
                    return;
                }

                const hasJsonData = columns.some(col => col.Field === 'json_data');
                const hasIsActive = columns.some(col => col.Field === 'is_active');

                // Step 4: If the table has the required columns, check for the form
                if (hasJsonData && hasIsActive) {
                    const getFormsQuery = `
                        SELECT * 
                        FROM \`${tableName}\`
                        WHERE json_data LIKE '%"${formTitle}"%'
                    `;

                    db.query(getFormsQuery, (err, results) => {
                        if (err) {
                            console.error(`Error fetching forms from table ${tableName}:`, err);
                        } else if (results.length > 0) {
                            found = true;
                            // Step 5: Update the is_active status
                            const updateQuery = `
                                UPDATE \`${tableName}\`
                                SET is_active = ?
                                WHERE json_data LIKE '%"${formTitle}"%'
                            `;

                            db.query(updateQuery, [isActive], (err) => {
                                if (err) {
                                    console.error(`Error updating form status in table ${tableName}:`, err);
                                    return res.status(500).json({ error: 'Database update error' });
                                }
                                res.json({ message: 'Form status updated successfully' });
                            });
                        }
                        completedQueries++;
                        // Check if all queries are completed
                        if (completedQueries === tables.length && !found) {
                            res.status(404).json({ message: 'Form not found' });
                        }
                    });
                } else {
                    completedQueries++;
                    // Check if all queries are completed
                    if (completedQueries === tables.length && !found) {
                        res.status(404).json({ message: 'Form not found' });
                    }
                }
            });
        });
    });
});


app.post('/api/submit/:tableName', (req, res) => {
    let { tableName } = req.params;
    tableName = `${tableName}_responses`; // ✅ Append "_responses"

    const formData = req.body;

    if (!tableName) {
        return res.status(400).json({ error: 'Table name is required' });
    }

    // ✅ Replace spaces in keys with underscores
    const cleanedFormData = {};
    for (let key in formData) {
        const cleanedKey = key.replace(/\s+/g, '_');
        cleanedFormData[cleanedKey] = formData[key];
    }

    // ✅ Construct SQL fields and values
    const fields = Object.keys(cleanedFormData).map(field => `\`${field}\``).join(', ');
    const values = Object.values(cleanedFormData).map(value => mysql.escape(value)).join(', ');

    // const query = `INSERT INTO \`${tableName}\` (${fields}) VALUES (${values})`;
    const query = `INSERT INTO \`${tableName}\` (timestamp , ${fields}) VALUES (NOW() , ${values} )`;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).json({ error: 'Database insert error', details: err.sqlMessage });
        } else {
            res.json({ message: 'Form data submitted successfully', insertedId: result.insertId });
        }
    });
});


// Endpoint to submit form responses
app.post('/submit-form', (req, res) => {
    const { title, responses } = req.body;
    const tableName = title.replace(/\s+/g, '_');

    const insertQuery = `INSERT INTO ?? SET ?`;
    db.query(insertQuery, [tableName, responses], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send('Response submitted successfully!');
    });
});

// Endpoint to get all form names (tables)
app.get('/get-forms', (req, res) => {
    const getTablesQuery = `SHOW TABLES`;

    db.query(getTablesQuery, (err, results) => {
        if (err) return res.status(500).send(err);

        // Extract table names from the result
        const tables = results.map(row => Object.values(row)[0]);
        res.json(tables);
    });
});

// Endpoint to get form structure (questions)
app.get('/get-form-structure/:title', (req, res) => {
    const tableName = req.params.title.replace(/\s+/g, '_');
    const getColumnsQuery = `SHOW COLUMNS FROM \`${tableName}\``;

    db.query(getColumnsQuery, (err, results) => {
        if (err) return res.status(500).send(err);

        // Extract column names, ignoring the 'id' column
        const questions = results
            .map(row => row.Field)
            .filter(field => field !== 'id'); // Remove 'id' column

        res.json(questions);
    });
});

// Endpoint to get form fields based on table name
app.get('/api/form-fields/:tableName', (req, res) => {
    const { tableName } = req.params;

    // Prevent SQL Injection: Allow only alphanumeric table names with underscores
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        return res.status(400).json({ error: 'Invalid table name format' });
    }

    const query = `DESCRIBE ??`;
    db.query(query, [tableName], (err, results) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const fields = results.map(field => ({
            name: field.Field,
            label: field.Field.charAt(0).toUpperCase() + field.Field.slice(1),
            type: field.Type.includes('int') ? 'number' : 'text',
            required: field.Null === 'NO'
        }));

        res.json(fields);
    });
});


const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'codeup'
};

app.get('/tables', async (req, res) => {
    try {
        const connection = await mysql2.createConnection(dbConfig);
        const [rows] = await connection.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'codeup' 
            AND table_name LIKE '%_responses'
        `);
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching table names:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/tables/:tableName', async (req, res) => {
    const { tableName } = req.params;
    try {
        const connection = await mysql2.createConnection(dbConfig);
        const [rows] = await connection.query(`SELECT * FROM ??`, [tableName]);
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching table data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});