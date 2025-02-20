const express = require('express')
var cors = require('cors')
const app = express()
var bodyParser = require('body-parser')
const conn = require('./connector')
const port = 3000

var jsonParser = bodyParser.json()

var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

// Enable CORS for all routes
app.use(cors(corsOptions));


app.get('/getuser', async (req, res) => {

    let id_user = req.query.id;
    console.log(id_user);
    try {
        const [data] = await conn.execute(`select * from users where id = ? LIMIT 1`, [id_user]);
        data.forEach((row) => {
            console.log(`${row.id} = ${row.lastname} ${row.firstname}`);
        });

        res.json(data);
    } catch (err) {
        console.log(err);
        res.json({ error: true, errormessage: "retrieve users error" });
    }
})

app.get('/getalluser', async (req, res) => {

    try {
        const [data] = await conn.execute(`select * from users LIMIT 1`);
        data.forEach((row) => {
            console.log(`${row.id} = ${row.lastname} ${row.firstname}`);
        });

        res.json(data);
    } catch (err) {
        console.log(err);
        res.json({ error: true, errormessage: "retrieve users error" });
    }
})

app.post('/Register', jsonParser, (req, res) => {
    console.log(req.body);
    res.statusCode = 200;
    res.send('Register')
})


app.listen(port, () => {
    console.log(`Its Register app listening on port ${port}`)
})