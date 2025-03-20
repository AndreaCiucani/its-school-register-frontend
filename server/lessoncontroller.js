const con = require('./connector');
const jwt = require('jsonwebtoken');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var auth = require('./authentication')

function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
}
function isDateValid(dateStr) {
    return !isNaN(new Date(dateStr));
}

function initLessonRoutes(app) {

    app.post('/createlesson', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        try {
            let validation = await con.query(`select id from modules where id = ?`, [requestbody.id_module]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_MODULE_ID" });
                return;
            }

            //data validation
            validation = await con.query(`select id from lessons where id_module = ? and (? between startdate and enddate 
            or ? between startdate and enddate)`, [requestbody.id_module, requestbody.startdate, requestbody.enddate]);
            if (validation[0].length < 1) {
                //lesson creation
                const [data] = await con.execute(`insert into lessons (startdate,enddate,argument,note,id_module) values (?,?,?,?,?)`, [requestbody.startdate, requestbody.enddate, requestbody.argument, requestbody.note, requestbody.id_module]);
                res.json(data);
            } else {
                res.json({ error: true, errormessage: "LESSON_EXISTS" });
            }

        } catch (err) {
            console.log("Createlesson Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.patch('/updatelesson/:id', jsonParser, auth.authenticateToken, async (req, res) => {
        let patchid = req.params.id;
        let requestbody = req.body;
        try {

            //data validation
            let validation = await con.query(`select id from modules where id = ?`, [requestbody.id_module]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_MODULE_ID" });
                return;
            }

            validation = await con.query(`select id from lessons where id_module = ? and (? between startdate and enddate 
            or ? between startdate and enddate) and id <> ?`, [requestbody.id_module, requestbody.startdate, requestbody.enddate, patchid]);
            if (validation[0].length > 0) {
                res.json({ error: true, errormessage: "LESSON_EXISTS" });
                return;
            }

            //update lesson
            const data = await con.execute(`update lessons set startdate = ?, enddate = ?, argument = ?, note = ?, id_module = ? where id = ?`, [new Date(requestbody.startdate), new Date(requestbody.enddate), requestbody.argument, requestbody.note, requestbody.id_module, patchid]);
            res.json(data);

        } catch (err) {
            console.log("Updatelesson Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }

    })

    app.delete('/deletelesson/:id', auth.authenticateToken, async (req, res) => {
        let deleteid = req.params.id;
        try {

            //data validation
            const validation = await con.query(`select id from lessons where id = ?`, [deleteid]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_LESSON_ID" });
                return;
            }

            //delete lesson
            const data = await con.execute(`delete from lessons where id = ?`, [deleteid]);
            res.json(data);
        } catch (err) {
            console.log("Deletelesson Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/getalllessons', auth.authenticateToken, async (req, res) => {
        pagenumber = (req.query.pagenumber - 1) * req.query.pagesize;
        pagesize = (req.query.pagenumber * req.query.pagesize) - 1;
        try {
            const [data] = await con.execute(`select * from lessons LIMIT ${pagenumber},${pagesize}`);

            res.json(data);
        } catch (err) {
            console.log("Getalllessons Error:" + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/getcalendar', jsonParser, auth.authenticateToken, async (req, res) => {
        //recupera il calendario dell'utente corrente filtrato per anno/mese
        try {
            let startdate = new Date(req.query.year, req.query.month - 1, 1);
            let enddate = new Date(req.query.year, req.query.month - 1, new Date(req.query.year, req.query.month, 0).getDate());
            const [data] = await con.execute(`select * from lessons l 
                inner join users_modules um on um.id_module = l.id_module
                inner join modules m on m.id = um.id_module
                where um.id_user = ? and l.startdate >= ? and l.enddate <= ?
                order by l.startdate, l.id_module`, [req.user.userid, startdate, enddate]);
            res.json(data);
        } catch (err) {
            console.log("GetCalendar Error:" + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.post('/generatelessons', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //genera delle lezioni in maniera ripetitiva, da data a data e per il giorno indicato
        try {
            //data validation
            let validation = await con.query(`select id from modules where id = ?`, [requestbody.id_module]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_MODULE_ID" });
                return;
            }
            if (!isDateValid(requestbody.startdate)) {
                res.json({ error: true, errormessage: "INVALID_STARTDATE" });
                return;
            }
            if (!isDateValid(requestbody.enddate)) {
                res.json({ error: true, errormessage: "INVALID_ENDDATE" });
                return;
            }

            let arrDates = [];
            let currdate = new Date(requestbody.startdate);
            let enddate = new Date(requestbody.enddate);
            while (currdate <= enddate) {
                if (currdate.getDay() == requestbody.day) {
                    //generate event if not exists              
                    const eventstartdate = new Date(currdate.getFullYear(), currdate.getMonth(), currdate.getDate(), requestbody.starthour, requestbody.startminute);
                    const eventenddate = new Date(currdate.getFullYear(), currdate.getMonth(), currdate.getDate(), requestbody.endhour, requestbody.endminute);
                    const [exists] = await con.query(`select id from lessons where (? between startdate and enddate 
                    or ? between startdate and enddate) and id_module = ?`, [eventstartdate, eventenddate, requestbody.id_module]);
                    if (exists.length <= 0) {
                        const [data] = await con.execute(`insert into lessons (startdate,enddate,argument,note,id_module) values (?,?,?,?,?)`, [eventstartdate, eventenddate, requestbody.argument ?? null, requestbody.note ?? null, requestbody.id_module]);
                        arrDates.push({ id: data["insertId"], startdate: eventstartdate, enddate: eventenddate, argument: requestbody.argument, note: requestbody.note, id_module: requestbody.id_module });
                    }
                }
                currdate = addDays(currdate, 1);
            }
            res.json(arrDates);
        } catch (err) {
            console.log("GenerateLessons Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.post('/signpresence', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //firma presenza
        try {

            //data validation
            let validation = await con.query(`select id from lessons where id = ?`, [requestbody.id_lesson]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_LESSON_ID" });
                return;
            }
            validation = await con.query(`select id from users where id = ?`, [requestbody.id_user]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_USER_ID" });
                return;
            }

            //sign user presence
            const signed = await con.query(`select id_lesson from lessons_presences where id_lesson = ? and id_user = ?`, [requestbody.id_lesson, requestbody.id_user]);
            if (signed[0].length < 1) {
                const data = await con.execute(`insert into lessons_presences (id_lesson, id_user, signdate) VALUES (?,?,NOW())`, [requestbody.id_lesson, requestbody.id_user]);
                res.json(data);
            } else {
                const data = await con.execute(`update lessons_presences set signdate = NOW() WHERE id_lesson = ? and id_user = ?`, [requestbody.id_lesson, requestbody.id_user]);
                res.json(data);
            }
        } catch (err) {
            console.log("SignPresence Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/getlessonpresences', jsonParser, auth.authenticateToken, async (req, res) => {
        //recupera l'elenco delle presenze dato l'id lezione
        try {

            //data validation
            let validation = await con.query(`select id from lessons where id = ?`, [req.query.id_lesson]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_LESSON_ID" });
                return;
            }

            //get lesson presences
            const [presences] = await con.query(`select * from lessons_presences where id_lesson = ?`, [req.query.id_lesson]);
            res.json(presences);
        } catch (err) {
            console.log("GetLessonPresences Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.post('/getuserpresences', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze dell'utente corrente, da data a data
        try {
            //get user presence
            const [presences] = await con.query(`select l.*, lp.signdate from lessons_presences lp
            join lessons l on l.id = lp.id_lesson
            where id_user = ? and l.startdate >= ? and l.enddate <= ?`, [req.user.userid, requestbody.startdate, requestbody.enddate]);
            res.json(presences);
        } catch (err) {
            console.log("GetUserPresences Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.post('/getmodulepresences', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze per l'utente corrente per il modulo indicato
        try {
            let validation = await con.query(`select id from modules where id = ?`, [requestbody.id_module]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_MODULE_ID" });
                return;
            }
            //get user presence
            const [presences] = await con.query(`select l.*, lp.signdate from lessons_presences lp
            join lessons l on l.id = lp.id_lesson
            where id_user = ? and l.id_module = ? and l.startdate >= ? and l.enddate <= ?`, [req.user.userid, requestbody.id_module, requestbody.startdate, requestbody.enddate]);
            res.json(presences);
        } catch (err) {
            console.log("GetUserPresences Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
    })

    app.get('/calculateuserpresences', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze utente e calcola la percentuale presenze rispetto al totale ore di ogni modulo; utente opzionale
        if (req.query.id_user != 0 && req.query.id_user != undefined) {
            const [presences] = await con.query(`select lp.id_user, MAX(m.total_hours) total_hours, l.id_module, MAX(m.name) name, SUM(TIME_TO_SEC(TIMEDIFF(TIME(l.enddate), TIME(l.startdate)))) presence_hours, 0 perc 
                from lessons_presences lp 
                inner join lessons l on lp.id_lesson = l.id
                inner join users_modules um on um.id_module = l.id_module
                inner join modules m on m.id = um.id_module
                where IFNULL(lp.signdate, 0) <> 0 and lp.id_user = ?
                group by lp.id_user, l.id_module
                order by lp.id_user, l.id_module`, [req.query.id_user]);
                presences.forEach(function(row) {
                    row.presence_hours = (row.presence_hours / 3600);
                    row.perc = (row.presence_hours / row.total_hours) * 100;
                });
            res.json(presences);
        } else {
            const [presences] = await con.query(`select lp.id_user, MAX(m.total_hours) total_hours, l.id_module, MAX(m.name) name, SUM(TIME_TO_SEC(TIMEDIFF(TIME(l.enddate), TIME(l.startdate)))) presence_hours, 0 perc 
                from lessons_presences lp 
                inner join lessons l on lp.id_lesson = l.id
                inner join users_modules um on um.id_module = l.id_module
                inner join modules m on m.id = um.id_module
                where IFNULL(lp.signdate, 0) <> 0  
                group by lp.id_user, l.id_module
                order by lp.id_user, l.id_module`);
                presences.forEach(function(row) {
                    row.presence_hours = (row.presence_hours / 3600);
                    row.perc = (row.presence_hours / row.total_hours) * 100;
                });
            res.json(presences);
        }
    })

}

module.exports = initLessonRoutes;