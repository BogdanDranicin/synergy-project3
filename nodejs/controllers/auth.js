const mysql = require("mysql");
const { sign } = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


exports.login = async (req, res) => {
    try {
        const { login, password } = req.body;

        if( !login || !password ) {
            return res.status(400).render('login', {
                message: 'Пожалуйста, заполните данные'
            })
        }

        db.query('SELECT * FROM users WHERE login = ?', [login], async (error, results) => {
            console.log(results);
            if (!results || !(await bcrypt.compare(password, results[0].password))) {
                res.status(401).render('login', {
                    message: 'Пароль или логин введены неправильно'
                })
            } else {
                const id = results[0].id;

                const token = sign({id}, process.env.JWT_SECRET, {
                    // expiresIN: process.env.JWT_EXPIRES_IN
                });
                console.log("The token is: " + token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }




                res.cookie('jwt', token, cookieOptions);
                res.status(200).redirect("/");

            }

        })

    } catch (error) {
        console.log(error);
    }
}

exports.register = (req, res) => {
    console.log(req.body);

    const {name, lastname, patronymic, login, password, passwordConfirm, series, number} = req.body;

    db.query('SELECT login FROM users WHERE login = ?', [login], async (error, results) => {
        if(error) {
            console.log(error);
        }

        if( results.length > 0 ) {
            return res.render('register', {
                message: 'Этот Логин уже зарегестрирован'
            })
        } else if( password !== passwordConfirm) {
            return res.render('register', {
                message: 'Пароли не совпадают'
            });
        }

        let hashedPassword = await  bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query('INSERT INTO users SET ?', {name: name, lastname: lastname, patronymic: patronymic, series: series, number: number, login: login, password: hashedPassword }, (error, results) => {
            if(error) {
                console.log(error);
            } else{
                console.log(results);
                return res.render('register', {
                    message: 'Пользователь зарегестрирован'
                });
            }
        })
    });

}
