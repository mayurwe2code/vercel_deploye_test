import connection from "../../Db.js";
import { StatusCodes } from "http-status-codes";
import nodemailer from "nodemailer"
import jwt from 'jsonwebtoken'


export function sign_by_driver(req, res) {

    console.log("user_signup")
    if (req.body.email != "" && req.body.password != "") {
        let u_email = req.body.email.trim()
        let u_password = req.body.password.trim()
        let regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z]{2,4})+$/;
        console.log("__" + u_email + "__")
        if (regex.test(u_email)) {
            connection.query("SELECT * FROM delivery_man WHERE email = '" + u_email + "'",
                (err, rows) => {
                    if (err) {
                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
                    } else {
                        console.log(rows)
                        if (rows != "") {
                            res.status(200).send({ "res_code": "002", "status": "ok", "response": "email already exists, please use logIn way", "status": false })
                        } else {
                            console.log("false")
                            const OTP = Math.floor(100000 + Math.random() * 900000);

                            connection.query('INSERT INTO `user_auth_by_otp` (`email`, `otp`, `user_password`) VALUES ("' + u_email + '","' + OTP + '","' + u_password + '")', (err, rows, fields) => {
                                if (err) {
                                    if (err.code == "ER_DUP_ENTRY") {
                                        res.status(200).send({ "res_code": "002", "status": "ok", "response": "email already exist, check your mail or try after sometime", "status": false })
                                    } else {
                                        res.status(200).send({ "res_code": "003", "status": "error", "response": "error", "status": false })
                                    }
                                } else {
                                    if (rows != '') {
                                        const mail_configs = {
                                            from: 'ashish.we2code@gmail.com',
                                            to: u_email,
                                            subject: 'Nursery_live one time password',
                                            text: "use otp within 60 sec.",
                                            html: "<h1>your one time password " + OTP + " <h1/><a href='https://script.google.com/macros/s/AKfycbzs_E_qqicp6FQLUoy-5T7eaSv7VTK01IW8t-GDaeM/dev' target='_blank'>https://script.google.com/macros/s/AKfycbzs_E_qqicp6FQLUoy-5T7eaSv7VTK01IW8t-GDaeM/dev</a>"
                                        }
                                        nodemailer.createTransport({
                                            service: 'gmail',
                                            auth: {
                                                user: 'ashish.we2code@gmail.com',
                                                pass: 'nczaguozpagczmjv'
                                            }
                                        })
                                            .sendMail(mail_configs, (err) => {
                                                if (err) {
                                                    res.status(200).send({ "response": "not send email service error", "status": false })
                                                    return //console.log({ "email_error": err });
                                                } else {
                                                    res.status(200).send({ "res_code": "001", "status": "ok", "response": "send otp on your mail", "otp": OTP, "expire_time": 180 })
                                                    return { "send_mail_status": "send successfully", "status": true, "expire_time": 180 };
                                                }
                                            })
                                        setTimeout(function () {
                                            connection.query('DELETE FROM `user_auth_by_otp` WHERE `id` = "' + rows.insertId + '"', (err, rows, fields) => {
                                                if (err) {
                                                    console.log("err____________________232")
                                                    console.log({ "response": "find error", "status": false })
                                                } else {
                                                    console.log("delete__________________234")
                                                    console.log(rows)
                                                }
                                            })
                                        }, 60000 * 3)
                                    } else {
                                        console.log("Not insert in otp in database")
                                    }

                                }
                            })
                        }
                    }
                }
            );
        } else {
            res.status(200).send({ "response": "email formate is not valid", "status": false })
        }
    } else {
        console.log("please fill mail brfore submit")
        res.status(200).send({ "response": " brfore submit, please fill mail address", "status": false })
    }
}
export function driver_otp_verify(req, res) {
    console.log("driver_otp_verify")
    let user_email = req.body.email.trim()
    let user_otp = req.body.otp.trim()
    if (req.body.email != "" && req.body.otp != "") {
        console.log('SELECT * FROM `user_auth_by_otp` WHERE email = "' + user_email + '" AND otp = "' + user_otp + '"')
        connection.query('SELECT * FROM `user_auth_by_otp` WHERE email = "' + user_email + '" AND otp = "' + user_otp + '"', (err, rows, fields) => {
            if (err) {
                console.log("err____________________267")
                console.log(err)
                res.status(200).send({ "response": "find error", "status": false })
            } else {
                console.log("_rows_________________271")
                console.log(rows)
                if (rows != "") {
                    if (user_email == rows[0].email && user_otp == rows[0].otp) {

                        connection.query("insert into delivery_man ( `email`,`password`) VALUES('" + user_email + "','" + rows[0].user_password + "') ",
                            (err, rows) => {
                                if (err) {
                                    console.log(err)

                                    if (err.code == "ER_DUP_ENTRY") {
                                        connection.query("SELECT * FROM delivery_man WHERE email = '" + user_email + "' ",
                                            (err, rows) => {
                                                if (err) {
                                                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ "response": "something went wrong", "status": false });
                                                } else {
                                                    if (rows != "") {
                                                        console.log("___________________________________________________284_chkkkkkkkkkkkkkkk=============")
                                                        console.log(rows)
                                                        jwt.sign({ id: rows[0].driver_id }, process.env.DRIVER_JWT_SECRET_KEY, function (err, token) {
                                                            res.status(200).json({ "success": true, "token": token, "user_details": rows });
                                                        })
                                                    } else {
                                                        res.status(200).json({ "success": false, "token": "" });
                                                    }
                                                }
                                            })
                                    } else {
                                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ "response": "something went wrong", "status": false });
                                    }

                                } else {
                                    let uid = rows.insertId
                                    jwt.sign({ id: rows.insertId }, process.env.DRIVER_JWT_SECRET_KEY, function (err, token) {
                                        //console.log(token);
                                        if (err) {
                                            //console.log(err)
                                        }
                                        connection.query('INSERT INTO `notification`(`actor_id`, `actor_type`, `message`, `status`) VALUES ("' + rows.insertId + '","user","welcome to nursery live please compleate your profile","unread"),("001","admin","create new user (user_id ' + rows.insertId + ')","unread")', (err, rows) => {
                                            if (err) {
                                                //console.log({ "notification": err })
                                            } else {
                                                console.log("_______notification-send__94________")
                                            }
                                        })
                                        res.send({ "status": true, "response": "successfully created your account", "user_id": rows.insertId, "token": token, "redirect_url": "http://localhost:3000/" })
                                    })
                                    // res.status(StatusCodes.OK).json({ message: "user added successfully" });
                                }
                            }
                        );


                    } else {
                        console.log("not match ________-278")
                    }
                } else {
                    res.status(200).send({ "response": "not matched, credential issue", "status": false })
                }
            }
        })
    } else {
        res.status(200).send({ "response": "please fill all inputs", "status": false })
    }
}

export function driver_login(req, res) {

    let regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z]{2,4})+$/;
    let user_email = req.body.email
    let password = req.body.password

    console.log("driver_login__________________________333")
    console.log(req.body)
    console.log(user_email)
    console.log(regex.test(user_email))
    if (req.body.email != "" && req.body.password != "") {
        if (regex.test(user_email)) {
            console.log("true")
            connection.query('SELECT * FROM delivery_man WHERE email ="' + user_email + '" AND password ="' + password + '"', (err, rows) => {
                if (err) {
                    console.log(err)
                    res.status(200).send({ "response": "login error", "status": false })
                } else {
                    console.log(rows)
                    if (rows != "") {


                        console.log("rows[0].user_id_______________324___")
                        console.log(process.env.DRIVER_JWT_SECRET_KEY)

                        jwt.sign({ id: rows[0].driver_id }, process.env.DRIVER_JWT_SECRET_KEY, function (err, token) {
                            //console.log(token);
                            if (err) {
                                //console.log(err)
                            }
                            let check_if = []
                            let { driver_id, driver_name, driver_last_name, date_of_birth, current_address, gender, age, contect_no, email, password, status, contect_no_is_verified, aadhar_no, licence_no, licence_issue_date, licence_validity_date, is_active, created_on, updated_on, current_latitude, current_longitude, fcm_token } = rows[0]
                            console.log("---------------------chk-after-if------------------------")

                            check_if.push(driver_name, driver_last_name, date_of_birth, current_address, gender, age, contect_no, email, password, aadhar_no, licence_no, licence_issue_date, licence_validity_date)

                            if (!check_if.includes(null) && !check_if.includes("")) {
                                console.log("---------------true-not-blank----------")
                                res.send({ "status": true, "res_code": "001", "response": "successfully login", "token": token, "redirect_url": "http://localhost:3000/", "complete_profile": true, "user_detaile": { driver_id, driver_last_name, date_of_birth, current_address, gender, age, contect_no, email, password, status, contect_no_is_verified, aadhar_no, licence_no, licence_issue_date, licence_validity_date, is_active, created_on, updated_on, current_latitude, current_longitude, fcm_token } })
                            } else {
                                console.log("---------------else-blank----------")
                                res.send({ "status": true, "res_code": "001", "response": "successfully login", "token": token, "redirect_url": "http://localhost:3000/", "complete_profile": false, "user_detaile": { driver_id, driver_last_name, date_of_birth, current_address, gender, age, contect_no, email, password, status, contect_no_is_verified, aadhar_no, licence_no, licence_issue_date, licence_validity_date, is_active, created_on, updated_on, current_latitude, current_longitude, fcm_token } })
                            }


                        })
                    } else {
                        res.status(200).send({ "status": false, "res_code": "003", "response": "creadintial not match" })
                    }
                }
            })
        } else {
            res.status(200).send({ "status": false, "res_code": "003", "response": "email formate no match" })

        }
    } else {
        console.log("please fill all inputs")
        res.status(200).send({ "status": false, "res_code": "003", "response": "please fill all inputs" })
    }
}


export function driver_forgate_password(req, res) {
    let regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z]{2,4})+$/;

    if (regex.test(req.body.email.trim()) && req.body.email != "") {
        const OTP = Math.floor(100000 + Math.random() * 900000);

        connection.query("select * from delivery_man where email = '" + req.body.email.trim() + "'", (err, rows) => {
            if (err) {
                console.log(err)
                res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ "response": "something went wrong", "status": false });
            } else {
                if (rows != "") {
                    connection.query('INSERT INTO `user_auth_by_otp` (`email`, `otp`) VALUES ("' + req.body.email.trim() + '","' + OTP + '")', (err, rows, fields) => {
                        if (err) {
                            if (err.code == "ER_DUP_ENTRY") {
                                res.status(200).send({ "status": "200", "response": "email already exist, check your mail or try after sometime", "status": false })
                            } else {
                                res.status(200).send({ "error": "find error ", "status": false })
                            }
                        } else {
                            if (rows != '') {
                                const mail_configs = {
                                    from: 'ashish.we2code@gmail.com',
                                    to: req.body.email,
                                    subject: 'Nursery_live one time password',
                                    text: "use otp within 60 sec.",
                                    html: "<h1>your one time password " + OTP + " <h1/>"
                                }
                                nodemailer.createTransport({
                                    service: 'gmail',
                                    auth: {
                                        user: 'ashish.we2code@gmail.com',
                                        pass: 'nczaguozpagczmjv'
                                    }
                                })
                                    .sendMail(mail_configs, (err) => {
                                        if (err) {
                                            res.status(200).send({ "response": "not send email service error", "status": false })
                                            return //console.log({ "email_error": err });
                                        } else {
                                            res.status(200).send({ "response": "send otp on your mail", "otp": OTP, "status": true, "expire_time": 180 })
                                            return { "send_mail_status": "send successfully", "expire_time": 180 };
                                        }
                                    })
                                setTimeout(function () {
                                    connection.query('DELETE FROM `user_auth_by_otp` WHERE `id` = "' + rows.insertId + '"', (err, rows, fields) => {
                                        if (err) {
                                            console.log("err____________________232")
                                            console.log(err)
                                        } else {
                                            console.log("delete__________________234")
                                            console.log(rows)
                                        }
                                    })
                                }, 60000 * 3)
                            } else {
                                console.log("Not insert in otp in database")
                            }
                        }
                    })
                } else {
                    res
                        .status(200)
                        .json({ "response": " eamil not exist", "status": false });
                }
            }
        })
    } else {
        res.status(200).send({ "response": "cheack eamil foramate", "status": false })
    }

}

export function driver_forgate_password_update(req, res) {
    console.log("________________delivery_man_forgate_password_update--------------------" + req.driver_token)
    let psw = req.body.password.trim()
    console.log(psw)
    console.log("update delivery_man  set `password`= '" + psw + "' where driver_id ='" + req.driver_id + "'",)

    connection.query(
        "update delivery_man  set `password`= '" + psw + "' where driver_id ='" + req.driver_id + "'",
        (err, rows) => {
            if (err) {
                console.log(err)
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ "response": "something went wrong", "success": false });
            } else {
                console.log(rows.affectedRows)
                if (rows.affectedRows == '1') { res.status(StatusCodes.OK).json({ "response": "update your password successfully", "success": true, "user_detaile": rows }); } else { res.status(StatusCodes.OK).json({ "response": "update opration feild ", "success": false }); }

            }
        }
    );
}

export function set_driver_notification_token(req, res) {
    console.log("__________________not_token__update")
    let not_token = req.body.token.trim()
    console.log(not_token)
    connection.query(
        "update delivery_man  set `fcm_token`= '" + not_token + "' where driver_id ='" + req.driver_id + "'",
        (err, rows) => {
            if (err) {
                console.log(err)
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ "response": "something went wrong", "success": false });
            } else {
                console.log(rows.affectedRows)
                if (rows.affectedRows == '1') { res.status(StatusCodes.OK).json({ "response": "update your token successfully", "success": true }); } else { res.status(StatusCodes.OK).json({ "response": "update opration feild ", "success": false }); }

            }
        }
    );
}


export async function driver_details(req, res) {
    connection.query("select * from user_and_vehicle_view where driver_id= '" + req.driver_id + "'", (err, rows) => {
        if (err) {
            res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ message: "something went wrong", "status": false });
        } else {
            res.status(StatusCodes.OK).json(rows);
        }
    });
}
export async function only_driver_list(req, res) {
    let query_ = "select * from delivery_man where"
    for (let k in req.body) {
        if (req.body[k] != "") {
            query_ += ` ${k} = '${req.body[k]}' AND  `
        }
    }
    query_ = query_.substring(0, query_.length - 5)
    console.log(query_)
    connection.query(query_, (err, rows) => {
        if (err) {
            res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ message: "something went wrong", "status": false });
        } else {
            res.status(StatusCodes.OK).json(rows);
        }
    });
}
export async function delete_restore_driver(req, res) {
    var { driver_id, is_active, status } = req.body
    let query_ = "update delivery_man  set "
    if (driver_id != "" && is_active != "" && status != "") {
        query_ += " `is_active`='" + is_active + "' ,`status`='" + status + "' where driver_id ='" + driver_id + "'"
    } else {
        // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "please send driver id", "status": false });
        if (is_active != "") {
            query_ += " `is_active`='" + is_active + "' where driver_id ='" + driver_id + "'"
        }
        if (status != "") {
            query_ += "`status`='" + status + "' where driver_id ='" + driver_id + "'"
        }
    }
    console.log(query_)
    connection.query(query_,
        (err, rows) => {
            if (err) {
                console.log(err)
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
            } else {
                res.status(StatusCodes.OK).json({ message: "updated user successfully", "status": true });
            }
        }
    );

}



export async function update_driver(req, res) {
    var { driver_name, driver_last_name, date_of_birth, current_address, gender, age, contect_no, aadhar_no, licence_no, licence_issue_date, licence_validity_date, driver_id
    } = req.body;

    let srt_user = "update delivery_man  set `driver_name`='" + driver_name + "', `driver_last_name`='" + driver_last_name + "', `date_of_birth`='" + date_of_birth + "', `current_address`='" + current_address + "', `gender`='" + gender + "', `age`='" + age + "', `contect_no`='" + contect_no + "', `aadhar_no` = '" + aadhar_no + "',`licence_no`='" + licence_no + "',`licence_issue_date`='" + licence_issue_date + "',`licence_validity_date`='" + licence_validity_date + "'"

    for (let k in req.files) {
        srt_user += ` ,${k} = 'http://192.168.29.109:8888/driver_profile/${req.files[k][0]["filename"]}'`
    }


    if (req.headers.admin_token != "" && req.headers.admin_token != undefined) {
        srt_user += " where driver_id ='" + driver_id + "'"
    } else if (req.headers.driver_token != "" && req.headers.driver_token != undefined) {
        srt_user += " where driver_id ='" + req.driver_id + "'"
    } else {
        srt_user = ""
    }

    console.log(srt_user)
    connection.query(srt_user, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            console.log(rows)
            res.status(StatusCodes.OK).json({ message: "updated user successfully", "status": true });
        }
    }
    );
}

export function add_working_area(req, res) {
    let { city, area_name, pin_code, driver_log, driver_lat } = req.body
    let query_ = ""
    if (req.headers.admin_token != "" && req.headers.admin_token != undefined) {
        query_ += "INSERT INTO `driver_working_area`(`city`, `area_name`, `pin_code`, `driver_log`, `driver_lat`) VALUES ('" + city + "','" + area_name + "'," + pin_code + "," + driver_log + "," + driver_lat + ")"
    }
    if (req.headers.driver_token != "" && req.headers.driver_token != undefined) {
        query_ += "INSERT INTO `driver_working_area`( `city`, `area_name`, `pin_code`, `driver_log`, `driver_lat`) VALUES ('" + city + "','" + area_name + "'," + pin_code + "," + driver_log + "," + driver_lat + ")"
    }
    console.log(query_)
    connection.query(query_, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            res.status(StatusCodes.OK).json({ message: "added yuor working area successfully", "status": true });
        }
    }
    );
}

export function chouse_driver_for_delivery(req, res) {
    let { order_id, delivery_lat, delivery_log, nearest_of_delivery_pin } = req.body
    let query_ = ""
    if (nearest_of_delivery_pin != "" && nearest_of_delivery_pin != undefined && nearest_of_delivery_pin != null) {
        query_ += "SELECT *, ( 3959 * acos( cos( radians(" + delivery_lat + ") ) * cos( radians( driver_lat ) ) * cos( radians( driver_log ) - radians(" + delivery_log + ") ) + sin( radians(" + delivery_lat + ") ) * sin( radians( driver_lat ) ) ) ) AS distance FROM driver_working_area  LEFT JOIN delivery_man ON driver_working_area.driver_id = delivery_man.driver_id  HAVING distance < " + nearest_of_delivery_pin + " "
    } else {
        query_ += "SELECT * FROM driver_working_area  LEFT JOIN delivery_man ON driver_working_area.driver_id = delivery_man.driver_id "
    }
    console.log(query_)
    connection.query(query_, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            res.status(StatusCodes.OK).json(rows);
        }
    }
    );
}



export function register_your_vehicle(req, res) {
    let { company_name, model, color, registration_no_of_vehicle, chassis_number, vehicle_owner_name, puc_expiration_date, insurance_expiration_date, registration_expiration_date } = req.body

    // let puc_certificate = insurance = registration = null;
    let str_fields = "";
    let srt_values = "";
    for (let k in req.files) {
        str_fields += ` ,${k}`
        srt_values += ` ,"http://192.168.29.109:8888/driver_profile/${req.files[k][0]["filename"]}"`
    }
    let srt_user = ""
    if (req.headers.admin_token != "" && req.headers.admin_token != undefined) {
        srt_user = "INSERT INTO `vehicle_detaile`(`company_name`, `model`, `color`, `registration_no_of_vehicle`, `chassis_number`, `vehicle_owner_name`, `puc_expiration_date`, `insurance_expiration_date`, `registration_expiration_date`" + str_fields + ") VALUES('" + company_name + "', '" + model + "', '" + color + "', '" + registration_no_of_vehicle + "', '" + chassis_number + "', '" + vehicle_owner_name + "','" + puc_expiration_date + "','" + insurance_expiration_date + "','" + registration_expiration_date + "'" + srt_values + ")"

    } else if (req.headers.driver_token != "" && req.headers.driver_token != undefined) {
        srt_user = "INSERT INTO `vehicle_detaile`(`driver_id`, `company_name`, `model`, `color`, `registration_no_of_vehicle`, `chassis_number`, `vehicle_owner_name`, `puc_expiration_date`, `insurance_expiration_date`, `registration_expiration_date`" + str_fields + ") VALUES( '" + req.driver_id + "', '" + company_name + "', '" + model + "', '" + color + "', '" + registration_no_of_vehicle + "', '" + chassis_number + "', '" + vehicle_owner_name + "','" + puc_expiration_date + "','" + insurance_expiration_date + "','" + registration_expiration_date + "'" + srt_values + ")"

    } else {
        srt_user = ""
    }
    console.log("srt_user====================================================srt_user")
    console.log(srt_user)
    connection.query(srt_user, (err, rows) => {
        if (err) {
            console.log(err)
            if (err["errno"] == '1062') {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err["sqlMessage"], "status": false });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
            }
        } else {
            res.status(StatusCodes.OK).json({ message: "vehicle registration successfull", "status": true });
        }
    }
    );
}


export function order_asign(req, res) {
    let { order_id, payment, payment_method, order_delivery_confirm_code } = req.body
    console.log({ order_id, payment, payment_method, order_delivery_confirm_code })

    connection.query("INSERT INTO `order_delivery_details`(`order_id`, `payment`,  `payment_method`, `order_delivery_confirm_code`,`order_ready_to_asign_for_delivery_by`) VALUES ('" + order_id + "','" + payment + "', '" + payment_method + "', '" + order_delivery_confirm_code + "' ,'" + req.created_by_id + "')", (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            res.status(StatusCodes.OK).json(rows);
        }
    });
}

export function order_asign_by_delivery_admin(req, res) {
    let { order_id, driver_id } = req.body
    console.log({ order_id, driver_id })
    connection.query("SELECT * FROM `vehicle_detaile` WHERE driver_id = " + driver_id + " AND is_active='1'", (err, rows) => {
        if (err) {
            console.log("error vehicle_detaile=========" + err)
        } else {

            if (rows != "") {
                console.log("--ok--------------vehicle_detaile====ok=====")
                console.log(rows[0]["vehicle_id"])
                connection.query("UPDATE `order_delivery_details` SET `driver_id`='" + driver_id + "', `vehicle_id`='" + rows[0]["vehicle_id"] + "',`order_asign_by`='" + req.created_by_id + "',`last_modification_by`='delivery_admin',`last_modification_by_id`='" + req.created_by_id + "' WHERE order_id = " + order_id + "", (err, rows) => {
                    if (err) {
                        console.log(err)
                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
                    } else {
                        res.status(StatusCodes.OK).json(rows);
                    }
                }
                );
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "driver has no vehicle", "status": false });
            }
        }
    });
}

export function get_delivery_detaile_list(req, res) {
    let filter = "SELECT orders_details_id,payment,order_status,payment_method,order_delivery_details.created_on AS order_asign_date, order_delivery_details.driver_id,driver_name,driver_last_name,date_of_birth,contect_no , order_delivery_details.order_id, order_date, product_id,shipping_charges, delivery_date,delivery_lat,delivery_log, user_name, address, `order`.email AS user_email, pin_code, city, user_image, phone_no, total_order_product_quantity, order_delivery_details.vehicle_id,registration_no_of_vehicle,status_comment FROM `order_delivery_details` LEFT JOIN delivery_man ON order_delivery_details.driver_id = delivery_man.driver_id LEFT JOIN `order` ON order_delivery_details.order_id = `order`.order_id LEFT JOIN `vehicle_detaile` ON vehicle_detaile.vehicle_id = order_delivery_details.vehicle_id where"
    let req_obj = req.body

    if (req.body.date_from != "" && req.body.date_from != undefined && req.body.date_to != "" && req.body.date_to != undefined) {
        filter += " delivery_date between '" + req.body.date_from + "' AND '" + req.body.date_to + "' AND  "
    }

    for (let k in req_obj) {
        if (req_obj[k] != "" && k != "date_from" && k != "date_to") {
            filter += ` ${k} = '${req_obj[k]}' AND  `
        }
    }

    if (req.headers.driver_token != "" && req.headers.driver_token != undefined) {
        filter += ` order_delivery_details.driver_id = '${req.driver_id}' AND  `
    }

    filter = filter.substring(0, filter.length - 5);
    console.log("filter==============================================");
    console.log(filter);
    console.log(filter + "GROUP BY order_delivery_details.order_id");


    connection.query(filter + "GROUP BY order_delivery_details.order_id", (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            res.status(StatusCodes.OK).json(rows);
        }
    }
    );
}


export function delivery_area_list(req, res) {
    let qyery_ = "SELECT * FROM `driver_working_area` WHERE"
    console.log(req.query)
    for (let k in req.query) {
        if (req.query[k] != "") { qyery_ += ` ${k} = '${req.query[k]}' AND  ` }

    }

    if (req.headers.driver_token != "" && req.headers.driver_token != undefined) {
        qyery_ += ` driver_id = '${req.driver_id}' AND  `
    }

    qyery_ = qyery_.substring(0, qyery_.length - 5);
    connection.query(qyery_, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            res.status(StatusCodes.OK).json(rows);
        }
    }
    );
}

export function active_deactive_area(req, res) {
    console.log(req.body)
    let query_ = "UPDATE `driver_working_area` SET "

    let { id, user_active_this_area, is_active, driver_id } = req.body
    if (user_active_this_area != undefined) {
        query_ += `user_active_this_area = '${user_active_this_area}'`
    } else if (is_active != undefined) {
        query_ += `is_active = '${is_active}'`
    } else if (driver_id != undefined) {
        query_ += `driver_id = '${driver_id}'`
    } else {
        query_ = ""
    }

    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    console.log(query_ + " WHERE id=" + id + "")
    connection.query(query_ + " WHERE id=" + id + "", (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            if (rows.affectedRows >= 1) {
                res.status(StatusCodes.OK).json({ message: "successfull changed working area status  ", "status": true });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
            }
        }
    });
}
export function change_order_detaile_status(req, res) {
    let { order_id, order_status, status_comment } = req.body

    // if(admin_token!=""&& admin_token != undefined &&admin_token!=null){

    // }else if(vendor_token!=""&& vendor_token != undefined &&vendor_token!=null){

    // }else if(driver_token!=""&& driver_token != undefined &&driver_token!=null){

    // }
    let query_ = ""
    if (req.headers.admin_token != "" && req.headers.admin_token != undefined && req.headers.admin_token != null) {
        query_ = "UPDATE `order_delivery_details` SET `order_status`='" + order_status + "', `last_modification_by`='admin', `last_modification_by_id`='" + req.admin_id + "'"
    }
    if (req.headers.driver_token != "" && req.headers.driver_token != undefined && req.headers.driver_token != null) {
        query_ = "UPDATE `order_delivery_details` SET `order_status`='" + req.body.order_status + "', `last_modification_by`='delivery_man', `last_modification_by_id`='" + req.driver_id + "',`status_comment`='" + req.body.status_comment + "'"
    }
    console.log(query_ + " WHERE order_id='" + order_id + "'")
    connection.query(query_ + " WHERE order_id='" + order_id + "'", (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            if (rows.affectedRows >= 1) {
                // connection.query("UPDATE `order` SET `status_order`='" + order_status + "' WHERE order_id='" + order_id + "'", (err, rows) => {
                //     console.log("-------------order_delivery_details---order--539----------------" + err)
                // })
                res.status(StatusCodes.OK).json({ message: "status changed successfull", "status": true });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
            }
        }
    });
}

export function delivery_verify_code_match(req, res) {
    let { order_id, order_delivery_confirm_code } = req.body
    connection.query("SELECT * FROM `order_delivery_details` WHERE driver_id='" + req.driver_id + "' AND order_id='" + order_id + "' AND order_delivery_confirm_code ='" + order_delivery_confirm_code + "' ", (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            if (rows != "") {
                connection.query("UPDATE `order_delivery_details` SET `order_status`='delivered' WHERE driver_id='" + req.driver_id + "' AND order_id='" + order_id + "' AND order_delivery_confirm_code ='" + order_delivery_confirm_code + "' ", (err, rows) => {
                    console.log(rows)
                })
                res.status(StatusCodes.OK).json({ message: "Confirmation  successfull", "status": true });
            } else {
                res.status(200).json({ message: "not match credintials", "status": false });
            }
        }
    });
}

export function driver_add_by_admin(req, res) {
    let { driver_name, driver_last_name, date_of_birth, current_address, gender, age, contect_no, email, password, aadhar_no, licence_no, licence_issue_date, licence_validity_date } = req.body

    let str_fields = "";
    let srt_values = "";
    for (let k in req.files) {
        str_fields += ` ,${k}`
        srt_values += ` ,"http://192.168.29.109:8888/driver_profile/${req.files[k][0]["filename"]}"`
    }

    console.log("INSERT INTO `delivery_man`(`driver_name`, `driver_last_name`, `date_of_birth`, `current_address`, `gender`, `age`, `contect_no`, `email`, `password`,`aadhar_no`, `licence_no`, `licence_issue_date`, `licence_validity_date`" + str_fields + ") VALUES ( '" + driver_name + "', '" + driver_last_name + "', '" + date_of_birth + "', '" + current_address + "', '" + gender + "', '" + age + "', '" + contect_no + "', '" + email + "', '" + password + "', '" + aadhar_no + "', '" + licence_no + "', '" + licence_issue_date + "', '" + licence_validity_date + "' " + str_fields + ")")
    connection.query("INSERT INTO `delivery_man`(`driver_name`, `driver_last_name`, `date_of_birth`, `current_address`, `gender`, `age`, `contect_no`, `email`, `password`,`aadhar_no`, `licence_no`, `licence_issue_date`, `licence_validity_date`" + str_fields + ") VALUES ( '" + driver_name + "', '" + driver_last_name + "', '" + date_of_birth + "', '" + current_address + "', '" + gender + "', '" + age + "', '" + contect_no + "', '" + email + "', '" + password + "', '" + aadhar_no + "', '" + licence_no + "', '" + licence_issue_date + "', '" + licence_validity_date + "' " + srt_values + ")", (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            res.status(StatusCodes.OK).json(rows);
        }
    })
}

export async function order_details_for_driver(req, res) {
    const id = req.query.id;
    let resp_obj = {}
    // select order_id,user_id,vendor_id,total_order_product_quantity,total_amount  ,total_gst,total_cgst,total_sgst,total_discount,shipping_charges,payment_mode,payment_ref_id,order_date,delivery_date,discount_coupon ,discount_coupon_value from `order` where order_id ="398080" AND user_id ="35" GROUP BY order_id
    connection.query('select order_id,user_id,vendor_id,total_order_product_quantity,total_amount  ,total_gst,total_cgst,total_sgst,total_discount,shipping_charges,payment_mode,payment_ref_id,order_date,delivery_date,discount_coupon ,discount_coupon_value from `order`  where order_id ="' + id + '" GROUP BY order_id',
        (err, rows) => {
            if (err) {
                console.log(err)
                res.status(StatusCodes.INSUFFICIENT_STORAGE).json(err);
            } else {
                if (rows != "") {
                    resp_obj["success"] = true
                    resp_obj["order_detaile"] = rows

                    connection.query('select *, (SELECT GROUP_CONCAT(product_image_path) FROM product_images WHERE product_images.product_id = order_detaile.product_id) AS all_images_url, (SELECT GROUP_CONCAT(product_image_path) FROM product_images WHERE product_images.product_id = order_detaile.product_id AND image_position = "cover" group by product_images.product_id) AS cover_image FROM order_detaile where order_id =' + id + '',
                        (err, rows) => {
                            if (err) {
                                res.status(StatusCodes.INSUFFICIENT_STORAGE).json(err);
                            } else {
                                resp_obj["success"] = true
                                resp_obj["order_product_detaile"] = rows;
                                res.status(StatusCodes.OK).json(resp_obj);
                            }
                        }
                    );
                } else {
                    res.status(200).json({ "success": false, "response": "not found" });
                }
            }
        }
    )
}





export function vehicle_asign_by_admin(req, res) {
    console.log(req.body)
}

export function driver_list(req, res) {
    let query_ = "SELECT * FROM `user_and_vehicle_view` WHERE"
    for (let k in req.body) {
        query_ += ` ${k} = '${req.body[k]}' AND  `
    }
    query_ = query_.substring(0, query_.length - 5)
    connection.query(query_, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            res.status(StatusCodes.OK).json(rows);
        }
    }
    );
}
export function vehicle_list(req, res) {
    let query_ = "SELECT * FROM `vehicle_detaile` WHERE"
    for (let k in req.body) {
        if (req.body[k] != "") {
            query_ += ` ${k} = '${req.body[k]}' AND  `
        }
    }
    query_ = query_.substring(0, query_.length - 5)
    console.log(query_)
    connection.query(query_, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            res.status(StatusCodes.OK).json(rows);
        }
    }
    );
}

export function update_your_vehicle(req, res) {
    let { vehicle_id, company_name, model, color, registration_no_of_vehicle, chassis_number, vehicle_owner_name, puc_expiration_date, insurance_expiration_date, registration_expiration_date } = req.body

    // let puc_certificate = insurance = registration = null;
    let srt_values = "";
    for (let k in req.files) {
        srt_values += `  ,${k}="http://192.168.29.109:8888/driver_profile/${req.files[k][0]["filename"]}"`
    }
    let srt_user = ""
    if (req.headers.admin_token != "" && req.headers.admin_token != undefined) {
        srt_user = "UPDATE `vehicle_detaile` SET `company_name`='" + company_name + "', `model`='" + model + "', `color`='" + color + "', `registration_no_of_vehicle`='" + registration_no_of_vehicle + "', `chassis_number`='" + chassis_number + "', `vehicle_owner_name`='" + vehicle_owner_name + "', `puc_expiration_date`='" + puc_expiration_date + "', `insurance_expiration_date`='" + insurance_expiration_date + "', `registration_expiration_date`='" + registration_expiration_date + "'" + srt_values + " WHERE vehicle_id ='" + vehicle_id + "'"
    } else if (req.headers.driver_token != "" && req.headers.driver_token != undefined) {
        srt_user = "UPDATE `vehicle_detaile` SET `company_name`='" + company_name + "', `model`='" + model + "', `color`='" + color + "', `registration_no_of_vehicle`='" + registration_no_of_vehicle + "', `chassis_number`='" + chassis_number + "', `vehicle_owner_name`='" + vehicle_owner_name + "', `puc_expiration_date`='" + puc_expiration_date + "', `insurance_expiration_date`='" + insurance_expiration_date + "', `registration_expiration_date`='" + registration_expiration_date + "'" + srt_values + " WHERE vehicle_id ='" + vehicle_id + "'"
    } else {
        srt_user = ""
    }
    console.log(srt_user)
    connection.query(srt_user, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            if (rows.affectedRows == '1') { res.status(StatusCodes.OK).json({ message: "vehicle update successfull", "status": true }) } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
            }
        }
    }
    );
}

export function change_vehicle_feild(req, res) {
    let srt_user = "UPDATE `vehicle_detaile` SET"
    console.log("UPDATE `vehicle_detaile` SET")
    console.log(req.body)
    for (let k in req.body) {
        console.log("__" + req.body[k] + "___")
        srt_user += `  ${k}="${req.body[k]}",`
    }
    console.log(srt_user)

    srt_user = srt_user.substring(0, srt_user.length - 1)
    console.log(srt_user + ` where vehicle_id = '${req.body.vehicle_id}' `)
    connection.query(srt_user + ` where vehicle_id = '${req.body.vehicle_id}' `, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
        } else {
            if (rows.affectedRows == '1') { res.status(StatusCodes.OK).json({ message: "vehicle feild updated successfull", "status": true }); } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "status": false });
            }

        }
    }
    );
}
