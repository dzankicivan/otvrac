const express = require('express');
const pool = require('./config/db'); 
const app = express();
const PORT = 3000;
const path = require('path');

app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend/public')));


app.get('/', (req, res) => {
    res.redirect('/index.html'); 
});


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
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database query error' });
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
