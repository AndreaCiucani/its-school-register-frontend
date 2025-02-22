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

app.get('/getallusers', async (req, res) => {

    let start_value = (req.query.pagenumber - 1) * req.query.pagesize;
    let end_value = req.query.pagesize;
    let sql = "select * from users";
    if( !isNaN(start_value ) && !isNaN(end_value )){
        sql += `LIMIT ${start_value},${end_value}`;
    }

    try {
        const [data] = await conn.execute(sql);
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