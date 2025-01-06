const express = require('express');
const pool = require('./config/db'); 
const app = express();
const PORT = 3000;
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend/public')));


const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'NBA Players API',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    apis: ['./server.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /:
 *   get:
 *     description: Redirect to index.html
 *     responses:
 *       302:
 *         description: Redirect to index.html
 */

app.get('/', (req, res) => {
    res.redirect('/index.html'); 
});

/**
 * @swagger
 * /api/players:
 *   get:
 *     description: Get all players
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: field
 *         schema:
 *           type: string
 *         description: Field to search in
 *     responses:
 *       200:
 *         description: Fetched all players
 */


app.get('/api/players', async (req, res) => {
    const { search, field } = req.query;
    let query = `
        SELECT 
            players.first_name, 
            players.last_name, 
            players.position, 
            players.jersey_number, 
            players.height_cm, 
            players.weight_kg, 
            TO_CHAR(players.birthdate, 'DD.MM.YYYY') AS birth_date, 
            players.nationality, 
            teams.team_name AS team 
        FROM players 
        JOIN teams ON players.team_id = teams.id`;
    const params = [];

    if (search) {
        if (field && field !== 'all') {
            if (['first_name', 'last_name', 'position', 'nationality', 'teams.team_name'].includes(field)) {
                query += ` WHERE ${field} ILIKE $1`;
                params.push(`%${search}%`);
            } else if (['jersey_number', 'height_cm', 'weight_kg'].includes(field)) {
                query += ` WHERE ${field} = $1`;
                params.push(search);
            } else if (field === 'birth_date') {
                query += ` WHERE TO_CHAR(players.birthdate, 'DD.MM.YYYY') = $1`;
                params.push(search);
            }
        } else {
            query += ` WHERE 
                players.first_name ILIKE $1 OR
                players.last_name ILIKE $1 OR
                players.position ILIKE $1 OR
                players.nationality ILIKE $1 OR
                teams.team_name ILIKE $1 OR
                CAST(players.jersey_number AS TEXT) = $2 OR
                CAST(players.height_cm AS TEXT) = $2 OR
                CAST(players.weight_kg AS TEXT) = $2 OR
                TO_CHAR(players.birthdate, 'DD.MM.YYYY') = $3`;
            params.push(`%${search}%`, search, search);
        }
    }

    try {
        const result = await pool.query(query, params);
        res.json({
            status: "OK",
            message: "Fetched all players",
            response: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "Error",
            message: "Database query error",
            response: null
        });
    }
});

/**
 * @swagger
 * /api/players/{id}:
 *   get:
 *     description: Get a player by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Fetched player
 *       404:
 *         description: Player not found
 */

app.get('/api/players/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                players.id,
                players.first_name, 
                players.last_name, 
                players.position, 
                players.jersey_number, 
                players.height_cm, 
                players.weight_kg, 
                TO_CHAR(players.birthdate, 'DD.MM.YYYY') AS birth_date, 
                players.nationality, 
                teams.team_name AS team 
            FROM players 
            JOIN teams ON players.team_id = teams.id
            WHERE players.id = $1
        `, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({
                status: "Not Found",
                message: `Player with ID ${id} doesn't exist`,
                response: null
            });
        } else {
            res.json({
                status: "OK",
                message: "Fetched player",
                response: result.rows[0]
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "Error",
            message: "Database query error",
            response: null
        });
    }
});


/**
 * @swagger
 * /api/players/team/{team}:
 *   get:
 *     description: Get players by team
 *     parameters:
 *       - in: path
 *         name: team
 *         schema:
 *           type: string
 *         required: true
 *         description: Team name
 *     responses:
 *       200:
 *         description: Fetched players by team
 */

app.get('/api/players/team/:team', async (req, res) => {
    const { team } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                players.first_name, 
                players.last_name, 
                players.position, 
                players.jersey_number, 
                players.height_cm, 
                players.weight_kg, 
                TO_CHAR(players.birthdate, 'DD.MM.YYYY') AS birth_date, 
                players.nationality, 
                teams.team_name AS team 
            FROM players 
            JOIN teams ON players.team_id = teams.id
            WHERE teams.team_name ILIKE $1
        `, [`%${team}%`]);
        if (result.rows.length === 0) {
            res.status(404).json({
                status: "Not Found",
                message: `Team ${team} doesn't exist`,
                response: null
            });
        } else {
            res.json({
                status: "OK",
                message: "Fetched players by team",
                response: result.rows
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "Error",
            message: "Database query error",
            response: null
        });
    }
});

/**
 * @swagger
 * /api/players/position/{position}:
 *   get:
 *     description: Get players by position
 *     parameters:
 *       - in: path
 *         name: position
 *         schema:
 *           type: string
 *         required: true
 *         description: Player position
 *     responses:
 *       200:
 *         description: Fetched players by position
 */

app.get('/api/players/position/:position', async (req, res) => {
    const { position } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                players.first_name, 
                players.last_name, 
                players.position, 
                players.jersey_number, 
                players.height_cm, 
                players.weight_kg, 
                TO_CHAR(players.birthdate, 'DD.MM.YYYY') AS birth_date, 
                players.nationality, 
                teams.team_name AS team 
            FROM players 
            JOIN teams ON players.team_id = teams.id
            WHERE players.position ILIKE $1
        `, [`%${position}%`]);
        if (result.rows.length === 0) {
            res.status(404).json({
                status: "Not Found",
                message: `Position ${position} doesn't exist`,
                response: null
            });
        } else {
            res.json({
                status: "OK",
                message: "Fetched players by position",
                response: result.rows
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "Error",
            message: "Database query error",
            response: null
        });
    }
});


/**
 * @swagger
 * /api/players/nationality/{nationality}:
 *   get:
 *     description: Get players by nationality
 *     parameters:
 *       - in: path
 *         name: nationality
 *         schema:
 *           type: string
 *         required: true
 *         description: Player nationality
 *     responses:
 *       200:
 *         description: Fetched players by nationality
 */

app.get('/api/players/nationality/:nationality', async (req, res) => {
    const { nationality } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                players.first_name, 
                players.last_name, 
                players.position, 
                players.jersey_number, 
                players.height_cm, 
                players.weight_kg, 
                TO_CHAR(players.birthdate, 'DD.MM.YYYY') AS birth_date, 
                players.nationality, 
                teams.team_name AS team 
            FROM players 
            JOIN teams ON players.team_id = teams.id
            WHERE players.nationality ILIKE $1
        `, [`%${nationality}%`]);
        if (result.rows.length === 0) {
            res.status(404).json({
                status: "Not Found",
                message: `Nationality ${nationality} doesn't exist`,
                response: null
            });
        } else {
            res.json({
                status: "OK",
                message: "Fetched players by nationality",
                response: result.rows
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "Error",
            message: "Database query error",
            response: null
        });
    }
});

/**
 * @swagger
 * /api/players:
 *   post:
 *     description: Add a new player
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: 
 *                type: integer
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               position:
 *                 type: string
 *               jersey_number:
 *                 type: integer
 *               height_cm:
 *                 type: integer
 *               weight_kg:
 *                 type: integer
 *               birthdate:
 *                 type: string
 *                 format: date
 *               nationality:
 *                 type: string
 *               team_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Player added
 *       400:
 *         description: Bad request
 */

app.post('/api/players', async (req, res) => {
    const {id, first_name, last_name, position, jersey_number, height_cm, weight_kg, birthdate, nationality, team_id } = req.body;
    try {
        const playerCheck = await pool.query('SELECT * FROM players WHERE id = $1', [id]);
        if (playerCheck.rows.length > 0) {
            return res.status(400).json({
                status: "Error",
                message: `Player with ID ${id} already exists`,
                response: null
            });
        }

        const teamCheck = await pool.query('SELECT * FROM teams WHERE id = $1', [team_id]);
        if (teamCheck.rows.length === 0) {
            return res.status(400).json({
                status: "Error",
                message: `Team with ID ${team_id} does not exist`,
                response: null
            });
        }

        const result = await pool.query(`
            INSERT INTO players (id, first_name, last_name, position, jersey_number, height_cm, weight_kg, birthdate, nationality, team_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [id, first_name, last_name, position, jersey_number, height_cm, weight_kg, birthdate, nationality, team_id]);
        res.status(201).json({
            status: "Created",
            message: "Player added",
            response: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "Error",
            message: "Database query error",
            response: null
        });
    }
});

/**
 * @swagger
 * /api/players/{id}:
 *   put:
 *     description: Update a player by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Player ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               position:
 *                 type: string
 *               jersey_number:
 *                 type: integer
 *               height_cm:
 *                 type: integer
 *               weight_kg:
 *                 type: integer
 *               birthdate:
 *                 type: string
 *                 format: date
 *               nationality:
 *                 type: string
 *               team_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Player updated
 *       404:
 *         description: Player not found
 */

app.put('/api/players/:id', async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, position, jersey_number, height_cm, weight_kg, birthdate, nationality, team_id } = req.body;
    try {
        const result = await pool.query(`
            UPDATE players
            SET first_name = $1, last_name = $2, position = $3, jersey_number = $4, height_cm = $5, weight_kg = $6, birthdate = $7, nationality = $8, team_id = $9
            WHERE id = $10
            RETURNING *
        `, [first_name, last_name, position, jersey_number, height_cm, weight_kg, birthdate, nationality, team_id, id]);
        if (result.rows.length === 0) {
            res.status(404).json({
                status: "Not Found",
                message: `Player with ID ${id} doesn't exist`,
                response: null
            });
        } else {
            res.json({
                status: "OK",
                message: "Player updated",
                response: result.rows[0]
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "Error",
            message: "Database query error",
            response: null
        });
    }
});


/**
 * @swagger
 * /api/players/{id}:
 *   delete:
 *     description: Delete a player by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player deleted
 *       404:
 *         description: Player not found
 */


app.delete('/api/players/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            DELETE FROM players
            WHERE id = $1
            RETURNING *
        `, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({
                status: "Not Found",
                message: `Player with ID ${id} doesn't exist`,
                response: null
            });
        } else {
            res.json({
                status: "OK",
                message: "Player deleted",
                response: result.rows[0]
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "Error",
            message: "Database query error",
            response: null
        });
    }
});


app.get('/api/download', async (req, res) => {
    const { format, search, field } = req.query;
    
    let query = `
        SELECT 
            players.first_name, 
            players.last_name, 
            players.position, 
            players.jersey_number, 
            players.height_cm, 
            players.weight_kg, 
            TO_CHAR(players.birthdate, 'DD.MM.YYYY') AS birth_date, 
            players.nationality, 
            teams.team_name AS team 
        FROM players 
        JOIN teams ON players.team_id = teams.id`;
    const params = [];

    if (search) {
        if (field && field !== 'all') {
            if (['first_name', 'last_name', 'position', 'nationality', 'team'].includes(field)) {
                query += ` WHERE ${field === 'team' ? 'teams.team_name' : `players.${field}`} ILIKE $1`;
                params.push(`%${search}%`);
            } else if (['jersey_number', 'height_cm', 'weight_kg'].includes(field)) {
                query += ` WHERE players.${field} = $1`;
                params.push(search);
            } else if (field === 'birth_date') {
                query += ` WHERE TO_CHAR(players.birthdate, 'DD.MM.YYYY') = $1`;
                params.push(search);
            }
        } else {
            query += ` WHERE 
                players.first_name ILIKE $1 OR
                players.last_name ILIKE $1 OR
                players.position ILIKE $1 OR
                players.nationality ILIKE $1 OR
                teams.team_name ILIKE $1 OR
                CAST(players.jersey_number AS TEXT) = $2 OR
                CAST(players.height_cm AS TEXT) = $2 OR
                CAST(players.weight_kg AS TEXT) = $2 OR
                TO_CHAR(players.birthdate, 'YYYY-MM-DD') = $3`;
            params.push(`%${search}%`, search, search);
        }
    }

    try {
        const result = await pool.query(query, params);
        const data = result.rows;

        if (format === 'json') {
            res.setHeader('Content-Disposition', 'attachment; filename=nba_players_filtered.json');
            res.json(data);
        } else if (format === 'csv') {
            const csvData = convertToCSV(data);
            res.setHeader('Content-Disposition', 'attachment; filename=nba_players_filtered.csv');
            res.setHeader('Content-Type', 'text/csv');
            res.send(csvData);
        } else {
            res.status(400).json({ error: 'Invalid format' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database query error' });
    }
});



function convertToCSV(data) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
}

/**
 * @swagger
 * /api/openapi:
 *   get:
 *     description: Returns the OpenAPI specification
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
app.get('/api/openapi', (req, res) => {
    res.sendFile(path.join(__dirname, '../openapi.json'));
});

/**
 * @swagger
 * /api/players:
 *   patch:
 *     responses:
 *       501:
 *         description: Method not implemented for requested resource
 */

app.all('/api/players', (req, res) => {
    res.status(501).json({
        status: "Not Implemented",
        message: "Method not implemented for requested resource",
        response: null
    });
});

app.all('/api/players/:id', (req, res) => {
    res.status(501).json({
        status: "Not Implemented",
        message: "Method not implemented for requested resource",
        response: null
    });
});

app.use((req, res, next) => {
    res.status(404).json({
        status: "Not Found",
        message: "Endpoint not found",
        response: null
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: "Error",
        message: "Internal Server Error",
        response: null
    });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
