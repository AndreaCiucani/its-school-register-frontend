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
            validation = await con.query(`select id from lessons where id_module = ? and ? between startdate and enddate 
            or ? between startdate and enddate`, [requestbody.id_module, requestbody.startdate, requestbody.enddate]);
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
            let validation = await con.query(`select id from modules where id = ?`, [patchid]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "INVALID_MODULE_ID" });
                return;
            }

            validation = await con.query(`select id from lessons where id_module = ? and ? between startdate and enddate 
            or ? between startdate and enddate and id <> ?`, [requestbody.id_module, requestbody.startdate, requestbody.enddate, patchid]);
            if (validation[0].length > 0) {
                res.json({ error: true, errormessage: "LESSON_EXISTS" });
                return;
            }

            //update lesson
            const data = await con.execute(`update lessons set startdate = ?, enddate = ?, argument = ?, note = ?, id_module = ? where id = ?`, [requestbody.startdate, requestbody.enddate, requestbody.argument, requestbody.note, requestbody.id_module, patchid]);
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
        let requestbody = req.body;
        //recupera il calendario
        //filtrato per anno/mese
    })

    app.post('/generatelessons', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        try {
            //validation
            let validation = await con.query(`select id from modules where id = ?`, [requestbody.id_module]);
            if (validation[0].length <= 0) {
                res.json({ error: true, errormessage: "MODULE_DOESNT_EXIST" });
                return;
            }


            //generate lessons
            let currentDate = new Date(requestbody.startdate);
            let endDate = new Date(requestbody.enddate);
            let arrLessons = [];
            while (currentDate <= endDate) {
                if (currentDate.getDay() == requestbody.day) {
                    let startdate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), requestbody.starthour, requestbody.startminute);
                    let enddate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), requestbody.endhour, requestbody.endminute);

                    //validation + insert
                    validation = await con.query(`select id from lessons where id_module = ? and ? between startdate and enddate 
                    or ? between startdate and enddate`, [requestbody.id_module, startdate, enddate]);
                    if (validation[0].length <= 0) {
                        const [data] = await con.execute(`insert into lessons (startdate, enddate, id_module) values (?,?,?)`, [startdate, enddate, requestbody.id_module]);
                        arrLessons.push({ id: data.insertId, startdate: startdate, enddate: enddate, id_module: requestbody.id_module });
                    }
                }
                currentDate = addDays(currentDate, 1);

            }
            res.json(arrLessons);


        } catch (err) {
            console.log("Generatelessons Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }

    })

    app.post('/signpresence', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        try {
            let validation = await con.query(`select id from lessons where id = ?`, [requestbody.id_lesson]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "LESSON_DOESNT_EXIST" });
                return;
            }
            validation = await con.query(`select id from users where id = ?`, [requestbody.id_user]);
            if (validation[0].length < 1) {
                res.json({ error: true, errormessage: "USER_DOESNT_EXIST" });
                return;
            }
            validation = await con.query(`select * from lessons_presences where id_lesson = ? and id_user = ?`, [requestbody.id_lesson, requestbody.id_user]);
            if (validation[0].length > 0) {
                res.json({ error: true, errormessage: "SIGN_ALREADY_EXIST" });
                return;
            }
            //firma presenza
            const [data] = await con.execute(`insert into lessons_presences (id_lesson, id_user, signdate) values (?,?,now())`, [requestbody.id_lesson, requestbody.id_user]);
            res.json(data);


        } catch (err) {
            console.log("Generatelessons Error: " + err);
            res.json({ error: true, errormessage: "GENERIC_ERROR" });
        }
       
    })

    app.get('/getlessonpresences', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze
        //dato l'id lezione
    })

    app.get('/getuserpresences', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze
        //dell'utente corrente, da data a data
    })

    app.get('/getmodulepresences', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze
        //per il modulo indicato; opzionale filtro per utente
    })

    app.get('/calculateuserpresences', jsonParser, auth.authenticateToken, async (req, res) => {
        let requestbody = req.body;
        //recupera l'elenco delle presenze
        //utente e calcola la percentuale presenze rispetto al totale ore di ogni modulo
    })

}

module.exports = initLessonRoutes;