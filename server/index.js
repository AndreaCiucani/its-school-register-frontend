const crypto = require('crypto')
const express = require('express')
var cors = require('cors')
const app = express()
var bodyParser = require('body-parser')
const conn = require('./connector')
const port = 3000
const jwt = require('jsonwebtoken')

// generate jwt secret key (one time - copy to env variables)
// let secretkey = require('crypto').randomBytes(64).toString('hex');
// console.log(secreykey);

var jsonParser = bodyParser.json()

var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

// Enable CORS for all routes
app.use(cors(corsOptions));


app.get('/getuser', authenticateToken, async (req, res) => {

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

app.get('/getallusers', authenticateToken, async (req, res) => {

    let start_value = (req.query.pagenumber - 1) * req.query.pagesize;
    let end_value = req.query.pagesize;
    let sql = "select * from users ";

    sql += ` order by ${req.query.orderby}`

    if (!isNaN(start_value) && !isNaN(end_value)) {
        sql += ` LIMIT ${start_value},${end_value}`;
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

app.post('/createuser', jsonParser, authenticateToken, async (req, res) => {
    let requestbody = req.body;
    try {

        const validation = await conn.query(`select id from users where fiscalcode = ?`, [requestbody.fiscalcode]);
        if (validation[0].length < 1) {

            var hash = crypto.createHash('sha256').update(requestbody.password).digest('hex');
            const [data] = await conn.execute(`insert into users (firstname, lastname, password, email, phone, active, fiscalcode) values (?,?,?,?,?,?,?)`, [requestbody.firstname, requestbody.lastname, hash, requestbody.email, requestbody.phone, requestbody.active, requestbody.fiscalcode]);
            res.json(data);
        } else {
            res.json({ error: true, errormessage: "FISCALCODE_EXISTS" });
        }

    } catch (err) {
        console.log(err);
        res.json({ error: true, errormessage: "retrieve users error" });
    }
})

app.post('/login', jsonParser, async (req, res) => {
    let requestbody = req.body;
    try {
        let hash = crypto.createHash('sha256').update(requestbody.pwd).digest('hex');
        const data = await conn.query(`select id from users where email = ? and password = ? and active = 1`, [requestbody.email, hash]);
        if (data[0].length < 1) {
            res.json({ error: true, errormessage: "INVALID_USERPWD" });
        } else {
            const token = generateAccessToken({ username: requestbody.email });
            res.json({ error: false, errormessage: "", token: token });
        }
    } catch (err) {
        console.log(err);
        res.json({ error: true, errormessage: "GENERIC_ERROR" });
    }
})

app.delete('/deleteuser/:id', authenticateToken, async (req, res) => {
    let deleteid = req.params.id;
    try {

        //data validation
        const validation = await conn.query(`select id from users where id = ?`, [deleteid]);
        if (validation[0].length < 1) {
            res.json({ error: true, errormessage: "INVALID_USER_ID" });
            return;
        }

        //delete user
        const data = await conn.execute(`delete from users where id = ?`, [deleteid]);
        res.json(data);
    } catch (err) {
        console.log("Deleteuser Error: " + err);
        res.json({ error: true, errormessage: "GENERIC_ERROR" });
    }

})



app.patch('/updateuser/:id', jsonParser, authenticateToken, async (req, res) => {
    let patchid = req.params.id;
    let requestbody = req.body;
    try {

        //data validation
        const validation = await conn.query(`select id from users where id = ?`, [patchid]);
        if (validation[0].length < 1) {
            res.json({ error: true, errormessage: "INVALID_USER_ID" });
            return;
        }

        //update user
        const data = await conn.execute(`update users set lastname = ?, firstname = ?, phone = ?, email = ?, active = ?, fiscalcode = ? where id = ?`, [requestbody.lastname, requestbody.firstname, requestbody.phone, requestbody.email, requestbody.active, requestbody.fiscalcode, patchid]);
        res.json(data);

    } catch (err) {
        console.log("Updateuser Error: " + err);
        res.json({ error: true, errormessage: "GENERIC_ERROR" });
    }
})

app.post('/updatepwd', jsonParser, authenticateToken, async (req, res) => {
    let requestbody = req.body;
    try {

        //data validation
        const validation = await conn.query(`select id from users where id = ?`, [requestbody.id]);
        if (validation[0].length < 1) {
            res.json({ error: true, errormessage: "INVALID_USER_ID" });
            return;
        }

        //update user password
        var hash = crypto.createHash('sha256').update(requestbody.password).digest('hex');
        const data = await conn.execute(`update users set password = ? where id = ?`, [hash, requestbody.id]);
        res.json(data);

    } catch (err) {
        console.log("Updatepwd Error: " + err);
        res.json({ error: true, errormessage: "GENERIC_ERROR" });
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


function generateAccessToken(username) {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        console.log(err)
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}