const crypto = require('crypto')
const express = require('express')
var cors = require('cors')
const app = express()
var bodyParser = require('body-parser')
const conn = require('./connector')
const port = 3000
const jwt = require('jsonwebtoken')
const { request } = require('http')

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
        const [data] = await conn.execute(`select * from users where id = ? LIMIT 1`, [req.user.userid]);
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
        var hash = crypto.createHash('sha256').update(requestbody.pwd).digest('hex');
        const [data] = await conn.query(`select u.id, urc.id_role, urc.id_course from users u
              inner join users_roles_courses urc on urc.id_user = u.id
              where u.email = ? and u.password = ? and u.active = 1 `, [requestbody.email, hash]);
        if (data.length < 1) {
            res.json({ error: true, errormessage: "INVALID_USERPWD" });
        } else {
            const payload = { username: requestbody.email, userid: data[0]["id"], roles: data };
            const token = generateAccessToken(payload);
            res.json({ error: false, errormessage: "", token: token });
        }
    } catch (err) {
        console.log("Login Error: " + err);
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
        const data = await conn.execute(`update users set lastname = ?, firstname = ?, phone = ?, active = ?, fiscalcode = ? where id = ?`, [requestbody.lastname, requestbody.firstname, requestbody.phone, requestbody.active, requestbody.fiscalcode, patchid]);
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

app.listen(port, () => {
    console.log(`Its Register app listening on port ${port}`)
})


app.post('/createcourse', jsonParser, authenticateToken, async (req, res) => {
    let requestbody = req.body;
    try {

        const validation = await conn.query(`select name from courses where name = ? and year = ?`, [requestbody.name, requestbody.year]);
        if (validation[0].length < 1) {

            const [data] = await conn.execute(`insert into courses (name, year, period) values (?,?,?)`, [requestbody.name, requestbody.year, requestbody.period]);
            res.json(data);
        } else {
            res.json({ error: true, errormessage: "COURSE_EXISTS" });
        }

    } catch (err) {
        console.log(err);
        res.json({ error: true, errormessage: "retrieve courses error" });
    }
})

app.delete('/deletecourse/:id', authenticateToken, async (req, res) => {
    let deleteid = req.params.id;
    try {

        //data validation
        const validation = await conn.query(`select id from courses where id = ?`, [deleteid]);
        if (validation[0].length < 1) {
            res.json({ error: true, errormessage: "INVALID_COURSE_ID" });
            return;
        }

        //delete user
        const data = await conn.execute(`delete from courses where id = ?`, [deleteid]);
        res.json(data);
    } catch (err) {
        console.log("Deletecourse Error: " + err);
        res.json({ error: true, errormessage: "GENERIC_ERROR" });
    }

})

app.patch('/updatecourse/:id', jsonParser, authenticateToken, async (req, res) => {
    let patchid = req.params.id;
    let requestbody = req.body;
    try {

        //data validation
        const validation = await conn.query(`select id from courses where id = ?`, [patchid]);
        if (validation[0].length < 1) {
            res.json({ error: true, errormessage: "INVALID_COURSE_ID" });
            return;
        }

        //update course
        const data = await conn.execute(`update courses set name = ?, year = ?, period = ? where id = ?`, [requestbody.name, requestbody.year, requestbody.period, patchid]);
        res.json(data);

    } catch (err) {
        console.log("Updatecourse Error: " + err);
        res.json({ error: true, errormessage: "GENERIC_ERROR" });
    }
})

app.get('/getallcourses', authenticateToken, async (req, res) => {

    try {
        const [data] = await conn.query(`select * from courses`);
        res.json(data);

    } catch (err) {
        console.log(err);
        res.json({ error: true, errormessage: "retrieve courses error" });
    }
})

app.get('/getusercourses', authenticateToken, async (req, res) => {

    try {
        const [data] = await conn.query(`select distinct c.* from users_roles_courses urc inner join courses c on urc.id_course = c.id where urc.id_user = ?`, [req.user.userid]);
        res.json(data);
    } catch (err) {
        console.log(err);
        res.json({ error: true, errormessage: "retrieve usercourses error" });
    }
})

app.post('/linkcourse', authenticateToken, async (req, res) => {
    let requestbody = req.body;
    try {
        //data validation
        let validation = await conn.query(`select * from users_roles_courses where id_user = ? and id_role = ? and id_course = ?`, [requestbody.user, requestbody.role, requestbody.id_course]);
        if (validation[0].length < 1) {
            res.json({ error: true, errormessage: "LINK_ALREADY_EXISTS" });
            return;
        }
        validation = await conn.query(`select id from users where id_user = ?`, [requestbody.id_user]);
        if (validation[0].length < 1) {
            res.json({ error: true, errormessage: "USER_NOT_EXISTS" });
            return;
        }
        validation = await conn.query(`select id from roles where id_role = ?`, [requestbody.id_role]);
        if (validation[0].length < 1) {
            res.json({ error: true, errormessage: "ROLE_NOT_EXISTS" });
            return;
        }
        validation = await conn.query(`select id from courses where id_course = ?`, [requestbody.id_course]);
        if (validation[0].length < 1) {
            res.json({ error: true, errormessage: "COURSE_NOT_EXISTS" });
            return;
        }

    //add role/course
    const data = await con.execute(`INSERT INTO users_roles_courses (id_user, id_role, id_course) VALUES (?,?,?)`, [requestbody.id_user, requestbody.id_role, requestbody.id_course]);
    res.json(data);
  } catch (err) {
    console.log("linkcourse Error:" + err);
    res.json({ error: true, errormessage: "GENERIC_ERROR" });
  }
})

app.post('/unlinkcourse', jsonParser, authenticateToken, async (req, res) => {
    let requestbody = req.body;
    try {
        //data validation
        let validation = await con.query(`select * from users_roles_courses where id_user = ? and id_role = ? and id_course = ?`, [requestbody.id_user, requestbody.id_role, requestbody.id_course]);
        if (validation[0].length < 1) {
            res.json({ error: true, errormessage: "LINK_NOT_EXISTS" });
            return;
        }
        //add role/course
        const data = await con.execute(`DELETE FROM users_roles_courses WHERE id_user = ? AND id_role = ? AND id_course = ?`, [requestbody.id_user, requestbody.id_role, requestbody.id_course]);
        res.json(data);
    } catch (err) {
        console.log("unlinkcourse Error:" + err);
        res.json({ error: true, errormessage: "GENERIC_ERROR" });
    }
})






function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '5800s' });
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