import connection from "../../Db.js";
import { StatusCodes } from "http-status-codes";
import nodemailer from "nodemailer"
import jwt from 'jsonwebtoken'

export function vendor_signup(req, res) {
    console.log("vendor_signup")
    if (req.body.email != "" && req.body.password != "") {
        let u_email = req.body.email.trim()
        let u_password = req.body.password.trim()
        let regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z]{2,4})+$/;
        console.log("__" + u_email + "__")
        if (regex.test(u_email)) {
            connection.query("SELECT * FROM vendor WHERE BINARY email = '" + u_email + "'",
                (err, rows) => {
                    if (err) {
                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
                    } else {
                        console.log(rows)
                        if (rows != "") {
                            res.status(200).send({ "res_code": "002", "response": "email already exists, please use logIn way", "success": false })
                        } else {
                            console.log("false")
                            const OTP = Math.floor(100000 + Math.random() * 900000);

                            connection.query('INSERT INTO `user_auth_by_otp` (`email`, `otp`, `user_password`) VALUES ("' + u_email + '","' + OTP + '","' + u_password + '")', (err, rows, fields) => {
                                if (err) {
                                    if (err.code == "ER_DUP_ENTRY") {
                                        res.status(200).send({ "res_code": "002", "response": "email already exist, check your mail or try after sometime", "success": false })
                                    } else {
                                        res.status(200).send({ "res_code": "003", "response": "error", "success": false })
                                    }
                                } else {
                                    if (rows != '') {
                                        const mail_configs = {
                                            from: 'rahul.verma.we2code@gmail.com',
                                            to: u_email,
                                            subject: 'Nursery_live one time password',
                                            text: "use otp within 60 sec.",
                                            html: "<h1>your one time password " + OTP + " <h1/>"
                                        }
                                        nodemailer.createTransport({
                                            service: 'gmail',
                                            auth: {
                                                user: "rahul.verma.we2code@gmail.com",
                                                pass: "sfbmekwihdamgxia",
                                            }
                                        })
                                            .sendMail(mail_configs, (err) => {
                                                if (err) {
                                                    res.status(200).send({ "response": "not send email service error", "status": false })
                                                    return //console.log({ "email_error": err });
                                                } else {
                                                    res.status(200).send({ "res_code": "001", "success": true, "response": "send otp on your mail", "otp": OTP, "expire_time": 180 })
                                                    return { "send_mail_status": "send successfully", "success": true, "expire_time": 180 };
                                                }
                                            })
                                        setTimeout(function () {
                                            connection.query('DELETE FROM `user_auth_by_otp` WHERE `id` = "' + rows.insertId + '"', (err, rows, fields) => {
                                                if (err) {
                                                    console.log("err____________________232")
                                                    console.log({ "response": "find error", "success": false })
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
            res.status(200).send({ "response": "email formate is not valid", "success": false })
        }
    } else {
        console.log("please fill mail brfore submit")
        res.status(200).send({ "response": " brfore submit, please fill mail address", "success": false })
    }

}

export function vendor_otp_verify(req, res) {
    console.log("vendor_otp_verify________________")
    let user_email = req.body.email.trim()
    let user_otp = req.body.otp.trim()
    if (req.body.email != "" && req.body.otp != "") {
        // console.log('SELECT * FROM `user_auth_by_otp` WHERE email = "' + user_email + '" AND otp = "' + user_otp + '"')
        connection.query('SELECT * FROM `user_auth_by_otp` WHERE BINARY email = "' + user_email + '" AND otp = "' + user_otp + '"', (err, rows, fields) => {
            if (err) {
                console.log("err____________________267")
                console.log(err)
                res.status(200).send({ "response": "find error", "success": false })
            } else {
                console.log("_rows_________________271")
                console.log(rows)
                if (rows != "") {
                    if (user_email == rows[0].email && user_otp == rows[0].otp) {

                        connection.query("insert into vendor ( `email`,`password`) VALUES('" + user_email + "','" + rows[0].user_password + "') ",
                            (err, rows) => {
                                if (err) {
                                    console.log(err)

                                    if (err.code == "ER_DUP_ENTRY") {
                                        connection.query("SELECT * FROM vendor WHERE BINARY email = '" + user_email + "' ",
                                            (err, rows) => {
                                                if (err) {
                                                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ "response": "something went wrong", "success": false });
                                                } else {
                                                    if (rows != "") {
                                                        console.log("___________________________________________________284_chkkkkkkkkkkkkkkk=============")
                                                        console.log(rows)
                                                        jwt.sign({ id: rows[0].vendor_id }, process.env.VENDOR_JWT_SECRET_KEY, function (err, token) {
                                                            res.status(200).json({ "success": true, "token": token, "user_details": rows });
                                                        })
                                                    } else {
                                                        res.status(200).json({ "success": false, "token": "" });
                                                    }
                                                }
                                            })
                                    } else {
                                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ "response": "something went wrong", "success": false });
                                    }

                                } else {
                                    let uid = rows.insertId
                                    console.log("__________________________rows.insertId______________________")
                                    console.log(rows.insertId)
                                    jwt.sign({ id: rows.insertId }, process.env.VENDOR_JWT_SECRET_KEY, function (err, token) {
                                        //console.log(token);
                                        if (err) {
                                            //console.log(err)
                                        }
                                        connection.query('INSERT INTO `notification`(`actor_id`, `actor_type`, `message`, `status`) VALUES ("' + rows.insertId + '","vendor","welcome to nursery live please compleate your profile","unread"),("001","admin","create new vendor (vendor_id ' + rows.insertId + ')","unread")', (err, rows) => {
                                            if (err) {
                                                //console.log({ "notification": err })
                                            } else {
                                                console.log("_______notification-send__94________")
                                            }
                                        })
                                        res.send({ "success": true, "response": "successfully created your account", "user_id": rows.insertId, "token": token, "redirect_url": "http://localhost:3000/" })
                                    })



                                    // res.status(StatusCodes.OK).json({ message: "user added successfully" });
                                }
                            }
                        );


                    } else {
                        console.log("not match ________-278")
                    }
                } else {
                    res.status(200).send({ "response": "not matched, credential issue", "success": false })
                }
            }
        })
    } else {
        res.status(200).send({ "response": "please fill all inputs", "success": false })
    }
}

export function vendor_login(req, res) {
    let regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z]{2,4})+$/;
    let user_email = req.body.email.trim()
    let password = req.body.password.trim()

    console.log("VENDOR-----------------------------")
    console.log(req.body)
    console.log(user_email)
    console.log(regex.test(user_email))
    if (req.body.email != "" && req.body.password != "") {
        if (regex.test(user_email)) {
            console.log("true")
            connection.query('SELECT * FROM vendor WHERE BINARY email ="' + user_email + '" AND password ="' + password + '"', (err, rows) => {
                if (err) {
                    console.log(err)
                    res.status(200).send({ "response": "login error", "success": false })
                } else {
                    console.log(rows)
                    if (rows != "") {
                        let { vendor_id, owner_name, shop_name, email, password, mobile, shop_address, gstn, geolocation, shop_logo, availability, status, user_type } = rows[0]
                        console.log("rows[0].vendor_id_______________324___")
                        console.log(rows[0].vendor_id)
                        console.log(process.env.VENDOR_JWT_SECRET_KEY)
                        console.log("______________________________________________________________________________")
                        jwt.sign({ id: rows[0].vendor_id }, process.env.VENDOR_JWT_SECRET_KEY, function (err, token) {
                            //console.log(token);
                            if (err) {
                                //console.log(err)
                            }
                            if (owner_name != "" && shop_name != "" && email != "" && password != "" && mobile != "" && shop_address != "" && gstn != "" && geolocation != "" && shop_logo != "" && availability) {
                                res.send({ "success": true, "res_code": "001", "response": "successfully login", "token": token, "redirect_url": "http://localhost:3000/", "complete_profile": true, "vendor_detaile": { vendor_id, owner_name, shop_name, email, password, mobile, shop_address, gstn, geolocation, shop_logo, availability, status, user_type } })
                            } else {
                                res.send({ "success": true, "res_code": "001", "response": "successfully login", "token": token, "redirect_url": "http://localhost:3000/", "complete_profile": false, "vendor_detaile": { vendor_id, owner_name, shop_name, email, password, mobile, shop_address, gstn, geolocation, shop_logo, availability, status, user_type } })
                            }


                        })
                    } else {
                        res.status(200).send({ "success": false, "res_code": "003", "response": "creadintial not match" })
                    }
                }
            })
        } else {
            res.status(200).send({ "success": false, "res_code": "003", "response": "email formate no match" })

        }
    } else {
        console.log("please fill all inputs")
        res.status(200).send({ "success": false, "res_code": "003", "response": "please fill all inputs" })
    }
}

export function vendor_forgate_password(req, res) {
    let regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z]{2,4})+$/;
    if (regex.test(req.body.email.trim()) && req.body.email != "") {
        const OTP = Math.floor(100000 + Math.random() * 900000);


        connection.query("select * from vendor where BINARY email = '" + req.body.email.trim() + "'", (err, rows) => {
            if (err) {
                console.log(err)
                res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ "response": "something went wrong", "status": false });
            } else {
                if (rows != "") {
                    connection.query('INSERT INTO `user_auth_by_otp` (`email`, `otp`) VALUES ("' + req.body.email + '","' + OTP + '")', (err, rows, fields) => {
                        if (err) {
                            if (err.code == "ER_DUP_ENTRY") {
                                res.status(200).send({ "status": "200", "response": "email already exist, check your mail or try after sometime", "success": false })
                            } else {
                                res.status(200).send({ "error": "find error ", "success": false })
                            }
                        } else {
                            if (rows != '') {
                                const mail_configs = {
                                    from: 'rahul.verma.we2code@gmail.com',
                                    to: req.body.email,
                                    subject: 'Nursery_live one time password',
                                    text: "use otp within 60 sec.",
                                    html: "<h1>your one time password " + OTP + " <h1/>"
                                }
                                nodemailer.createTransport({
                                    service: 'gmail',
                                    auth: {
                                        user: "rahul.verma.we2code@gmail.com",
                                        pass: "sfbmekwihdamgxia",
                                    }
                                })
                                    .sendMail(mail_configs, (err) => {
                                        if (err) {
                                            res.status(200).send({ "response": "not send email service error", "success": false })
                                            return //console.log({ "email_error": err });
                                        } else {
                                            res.status(200).send({ "response": "send otp on your mail", "otp": OTP, "success": true, "expire_time": 180 })
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
                        .status(StatusCodes.INTERNAL_SERVER_ERROR)
                        .json({ "response": "email not exist", "status": false });
                }
            }
        })
    } else {
        res.status(200).send({ "response": "cheack eamil foramate", "success": false })
    }

}

export function vendor_forgate_password_update(req, res) {
    console.log("__________________user_forgate_password_update")
    let psw = req.body.password.trim()
    console.log(psw)
    console.log("update vendor set `password`= '" + psw + "' where vendor_id ='" + req.vendor_id + "'")
    connection.query(
        "update vendor set `password`= '" + psw + "' where vendor_id ='" + req.vendor_id + "'",
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

export async function vendor_details(req, res) {
    connection.query("select * from vendor where vendor_id= '" + req.vendor_id + "'", (err, rows) => {
        if (err) {
            res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ message: "something went wrong", "status": false });
        } else {
            res.status(StatusCodes.OK).json(rows);
        }
    });
}

export async function update_vendor_profile(req, res) {
    var { owner_name, shop_name, mobile, shop_address, gstn, geolocation, availability } = req.body;
    let srt_user = ""
    let srt_user1 = ""
    console.log(owner_name, shop_name, mobile, shop_address, gstn, geolocation, availability)
    console.log("_________v_id__" + req.vendor_id)
    // console.log(req.file)
    // console.log(req.file.filename)
    if (req.file == undefined || req.file == '') {
        var image = "no image"
        srt_user = 'UPDATE `vendor` SET `owner_name`="' + owner_name + '",`shop_name`="' + shop_name + '",`mobile`="' + mobile + '",`shop_address`="' + shop_address + '",`gstn`="' + gstn + '",`geolocation`="' + geolocation + '",`availability`="' + availability + '" '
    } else {
        var image = req.protocol + "://" + req.headers.host + "/vendor_shop_img/" + req.file.filename;
        //console.log(image)
        srt_user = 'UPDATE `vendor` SET `owner_name`="' + owner_name + '",`shop_name`="' + shop_name + '",`mobile`="' + mobile + '",`shop_address`="' + shop_address + '",`gstn`="' + gstn + '",`geolocation`="' + geolocation + '",`shop_logo`="' + image + '",`availability`="' + availability + '"'
    }
    if (req.headers.admin_token != "" && req.headers.admin_token != undefined) {
        srt_user += ' WHERE vendor_id = "' + req.body.vendor_id + '"'
        srt_user1 = "select * from vendor where vendor_id ='" + req.body.vendor_id + "' "
    } else if (req.headers.vendor_token != "" && req.headers.vendor_token != undefined) {
        srt_user += ' WHERE vendor_id = "' + req.vendor_id + '"'
        srt_user1 = "select * from vendor where vendor_id ='" + req.vendor_id + "' "
    } else {
        srt_user = ""
    }

    console.log(srt_user)
    connection.query(srt_user, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "success": false });
        } else {

            connection.query(srt_user1, (err, rows) => {
                if (err) {
                    console.log(err)
                } else {
                    res.status(StatusCodes.OK).json({ message: "updated vendor successfully", "success": true, "vendor_detaile": rows });
                }
            }
            );
        }
    }
    );
}

export async function admin_add_vendor(req, res) {
    var { owner_name, shop_name, email, mobile, shop_address, gstn, geolocation, availability } = req.body;
    let srt_user = ""
    // console.log(req.file)
    // console.log(req.file.filename)
    if (req.file == undefined || req.file == '') {
        var image = "no image"
        srt_user = 'INSERT INTO `vendor` (`owner_name`,`shop_name`,`email`,`mobile`,`shop_address`,`gstn`,`geolocation`,`availability`, `created_by`,`created_by_id`) VALUES ("' + owner_name + '","' + shop_name + '","' + email + '","' + mobile + '","' + shop_address + '","' + gstn + '","' + geolocation + '","' + availability + '","admin","' + req.created_by_id + '")'
    } else {
        var image = req.protocol + "://" + req.headers.host + "/vendor_shop_img/" + req.file.filename;
        //console.log(image)
        srt_user = 'INSERT INTO `vendor` (`owner_name`,`shop_name`,`email`,`mobile`,`shop_address`,`gstn`,`geolocation`,`shop_logo`,`availability`,`created_by`,`created_by_id`) VALUES ("' + owner_name + '","' + shop_name + '","' + email + '","' + mobile + '","' + shop_address + '","' + gstn + '","' + geolocation + '","' + image + '","' + availability + '","admin","' + req.created_by_id + '")'
    }
    console.log(srt_user)
    connection.query(srt_user, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "success": false });
        } else {
            res.status(StatusCodes.OK).json({ message: "add vendor successfully", "success": true });
        }
    }
    );
}

export function vendor_list(req, res) {
    let req_obj = req.body
    let search_query = "SELECT * FROM vendor WHERE "
    let m = 0
    for (let k in req_obj) {
        if (req_obj[k] != "") {
            if ("search" == k) {
                search_query += `owner_name LIKE "%${req_obj[k]}%" OR  shop_name LIKE "%${req_obj[k]}%" AND  `
            } else {
                search_query += `${k} = "${req_obj[k]}" AND  `
            }
        }
        if (m == Object.keys(req_obj).length - 1) {
            search_query = search_query.substring(0, search_query.length - 5)
        }
        m++
    }
    console.log(search_query)
    connection.query(search_query, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "something went wrong", "success": false });
        } else {
            res.status(StatusCodes.OK).json(rows);
        }
    }
    );
}


export function admin_change_vendor_status(req, res) {
    let res_obj = req.body;
    let query_ = `UPDATE vendor SET vendor_id= '${res_obj["vendor_id"]}' `
    for (let k in res_obj) {
        if ("vendor_id" != k) {
            query_ += ` , ${k} = '${res_obj[k]}' `
        }
    }
    console.log(`${query_} WHERE vendor_id ='${res_obj["vendor_id"]}' `)
    connection.query(`${query_} WHERE vendor_id ='${res_obj["vendor_id"]}' `, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ "response": "something went wrong", "success": false });
        } else {
            if (rows.affectedRows == '1') {
                if (res_obj.status != "" && res_obj.status != undefined && res_obj.status != null) {
                    res.status(StatusCodes.OK).json({ "response": "updated successfull", "success": true, status: res_obj.status });
                } else {
                    res.status(StatusCodes.OK).json({ "response": "updated successfull", "success": true });

                }
            } else {
                res.status(StatusCodes.OK).json({ "response": "something went wrong", "success": false });
            }

        }
    }
    );
}


export async function search_vendor_product(req, res) {
    var { price_from, price_to } = req.body;
    console.log(req.body)
    // 'SELECT *, (SELECT id FROM cart WHERE cart.product_id = product.id AND user_id = "' + req.user + '") FROM products  AND '
    var group_by = ' '
    if (req.query.group == "yes") {
        group_by = " group by product_id "
    }

    if ("DESC" in req.query) {
        search_string_asc_desc = " ORDER BY " + req.query["DESC"] + " DESC "
    }
    if ("ASC" in req.query) {
        search_string_asc_desc = " ORDER BY " + req.query["ASC"] + " ASC "
    }
    var string = "";
    if (req.body.is_verient) {
        string = "join";
    } else {
        string = "left join";
    }
    var search_string_asc_desc = ""
    // var query_string = "select * from product  where ";
    let search_obj = Object.keys(req.body)
    if (req.headers.vendor_token != "" && req.headers.vendor_token != undefined) {
        var search_string = 'SELECT id ,product.vendor_id AS vendor_id,name,seo_tag,brand,category,is_deleted,status,review,rating,description,care_and_Instructions,benefits,is_active,created_by,created_by_id,created_on,updated_on,product_verient_id,product_id,verient_name,quantity,unit,product_stock_quantity,price,mrp,gst,sgst,cgst,verient_is_deleted,verient_status,discount,verient_description,verient_is_active,verient_created_on,verient_updated_on,product_height,product_width,product_Weight ,(SELECT GROUP_CONCAT(product_image_path) FROM product_images WHERE product_images.product_verient_id = product_verient.product_verient_id) AS all_images_url, (SELECT GROUP_CONCAT(product_image_path) FROM product_images WHERE product_images.product_verient_id = product_verient.product_verient_id AND image_position = "cover" group by product_images.product_verient_id) AS cover_image FROM product ' + string + ' product_verient ON product.id = product_verient.product_id where product.vendor_id = "' + req.vendor_id + '" AND (product_verient.verient_is_deleted IS NULL OR product_verient.verient_is_deleted = 0 ) AND is_deleted = 0  AND  ';
    } else {
        var search_string = 'SELECT id ,product.vendor_id AS vendor_id,name,seo_tag,brand,category,is_deleted,status,review,rating,description,care_and_Instructions,benefits,is_active,created_by,created_by_id,created_on,updated_on,product_verient_id,product_id,verient_name,quantity,unit,product_stock_quantity,price,mrp,gst,sgst,cgst,verient_is_deleted,verient_status,discount,verient_description,verient_is_active,verient_created_on,verient_updated_on,product_height,product_width,product_Weight ,(SELECT GROUP_CONCAT(product_image_path) FROM product_images WHERE product_images.product_verient_id = product_verient.product_verient_id) AS all_images_url, (SELECT GROUP_CONCAT(product_image_path) FROM product_images WHERE product_images.product_verient_id = product_verient.product_verient_id AND image_position = "cover" group by product_images.product_verient_id) AS cover_image FROM product ' + string + ' product_verient ON product.id = product_verient.product_id where is_active = 1  AND  ';
    }

    if (price_from != "" && price_to != "") {
        search_string += '(`price` BETWEEN "' + price_from + '" AND "' + price_to + '") AND   '
    }

    for (var i = 0; i <= search_obj.length - 1; i++) {

        if (i >= 6) {
            if (i == 6) {
                if (req.body[search_obj[i]] != "") {
                    search_string += `name LIKE "%${req.body[search_obj[i]]}%" AND   `
                }
            } else {
                if (search_obj[i] == "is_verient") {
                    console.log("nonono" + req.body[search_obj[i]])
                } else {
                    if (req.body[search_obj[i]] != "") {
                        var arr = JSON.stringify(req.body[search_obj[i]]);
                        var abc = "'" + arr + "'"
                        const id = abc.substring(abc.lastIndexOf("'[") + 2, abc.indexOf("]'"));
                        search_string += ' ' + search_obj[i] + ' IN ' + '(' + id + ') AND   '

                        // search_string+= `${search_obj[i]} = "${req.body[search_obj[i]]}" AND   `
                    }
                }
            }
        } else {
            if (i > 1) {
                if (search_obj[i] != undefined && req.body[search_obj[i]] != "") {
                    search_string_asc_desc = ` ORDER BY ${search_obj[i].replace("__", "")} ${req.body[search_obj[i]]} `
                }
            }
        }
        if (i === search_obj.length - 1) {
            search_string = search_string.substring(0, search_string.length - 6);
            search_string += group_by
            search_string += search_string_asc_desc
            // if (search_obj[2] != undefined && req.body[search_obj[2]] != "") {
            // }

        }
    }
    console.log(search_string)
    var pg = req.query;
    var numRows;

    var numPerPage = pg.per_page;
    var page = parseInt(pg.page, pg.per_page) || 0;
    var numPages;
    var skip = page * numPerPage;
    // Here we compute the LIMIT parameter for MySQL query
    var limit = skip + "," + numPerPage;

    connection.query(
        "SELECT count(*) as numRows FROM product",
        (err, results) => {
            if (err) {
            } else {
                numRows = results[0].numRows;
                numPages = Math.ceil(numRows / numPerPage);
                var count_rows;
                connection.query(search_string.replace("*", "count(*) AS `count_rows` "),
                    (err, results) => {
                        console.log("results---------------------------------------")
                        // console.log(results)
                        try {
                            count_rows = results[0]["count_rows"]
                        } catch (e) {
                            count_rows = "no"
                        }

                    })

                console.log("check_------------------------qyueryyyyy---545")
                console.log("" + search_string + " LIMIT " + limit + "")
                connection.query("" + search_string + " LIMIT " + limit + "",
                    (err, results) => {
                        if (err) {
                            console.log("err___________________194")
                            console.log(err)
                            res.status(200).send({ "response": "find error" });
                        } else {
                            // //console.log("_____")
                            var responsePayload = {
                                results: results,
                            };
                            if (page < numPages) {
                                responsePayload.pagination = {
                                    count_rows: count_rows,
                                    current: page,
                                    perPage: numPerPage,
                                    previous: page > 0 ? page - 1 : undefined,
                                    next: page < numPages - 1 ? page + 1 : undefined,
                                };
                            } else
                                responsePayload.pagination = {
                                    err:
                                        "queried page " +
                                        page +
                                        " is >= to maximum page number " +
                                        numPages,
                                };
                            res.status(200).send(responsePayload);
                        }
                    }
                );
            }
        }
    );
}

export function order_verify_by_vendor(req, res) {
    let { order_verify, order_id } = req.body
    console.log("check order_verify_by_admin" + req.vendor_id)
    connection.query("UPDATE `order` SET `verify_by_vendor` = '" + order_verify + "' WHERE `order_id` = '" + order_id + "' AND `vendor_id` = '" + req.vendor_id + "'", (err, rows, fields) => {
        if (err) {
            console.log(err)
            res.status(200).send({ "status": false, "response": "find some error" })
        } else {
            if (rows.affectedRows >= 1) { res.status(200).send({ "status": true, "response": "order " + order_verify + " successfull" }) } else { res.status(200).send({ "status": false, "response": "find some error" }) }
        }
    })
}

export function vendor_orders_status(req, res) {
    connection.query("SELECT count(*) AS total_orders_from_order_table,(SELECT COUNT(*) FROM `order` WHERE `vendor_id` ='" + req.vendor_id + "' AND `verify_by_vendor` = 'accepted') AS accepted_order,(SELECT COUNT(*) FROM `order` WHERE `vendor_id` ='" + req.vendor_id + "' AND `verify_by_vendor` = 'rejected') AS rejected_order,(SELECT COUNT(*) FROM `order` WHERE `vendor_id` ='" + req.vendor_id + "' AND `verify_by_vendor` = 'pending') AS pending_order,( SELECT COUNT(*) FROM `order_delivery_details` ,`order` WHERE `order_delivery_details`.`order_id` = `order`.`order_id` AND `vendor_id` = '" + req.vendor_id + "') AS total_orders_from_order_delivery_table ,( SELECT COUNT(*) FROM `order_delivery_details`, `order` WHERE `order_delivery_details`.`order_id` = `order`.`order_id` AND `vendor_id` = '" + req.vendor_id + "' AND `order_status` = 'ready_to_pickup' ) AS ready_to_pickup_orders,( SELECT COUNT(*) FROM `order_delivery_details`, `order` WHERE `order_delivery_details`.`order_id` = `order`.`order_id` AND `vendor_id` = '" + req.vendor_id + "' AND `order_status` = 'Pickup' ) AS pickup_orders,( SELECT COUNT(*) FROM `order_delivery_details` ,`order` WHERE `order_delivery_details`.`order_id` = `order`.`order_id` AND `vendor_id` = '" + req.vendor_id + "' AND `order_status` = 'Delivered' ) AS delivered_orders,( SELECT COUNT(*) FROM `order_delivery_details`, `order` WHERE `order_delivery_details`.`order_id` = `order`.`order_id` AND `vendor_id` = '" + req.vendor_id + "' AND `order_status` = 'Rejected_by_customer' ) AS rejected_by_customer_orders,( SELECT COUNT(*) FROM `order_delivery_details` ,`order` WHERE `order_delivery_details`.`order_id` = `order`.`order_id` AND `vendor_id` = '" + req.vendor_id + "' AND `order_status` = 'Failed_Delivery_Attempts' ) AS failed_Delivery_Attempts_orders FROM `order` WHERE `vendor_id` ='" + req.vendor_id + "'", (err, rows, fields) => {
        if (err) {
            console.log(err)
            res.status(200).send({ "status": false, "response": "find some error" })
        } else {
            res.status(200).send({ "status": true, "response": rows })
        }
    })
}
export async function vendor_product_list(req, res) {
    console.log(req.body)
    var search_string_asc_desc = ""
    let search_obj = Object.keys(req.body)
    if (req.headers.vendor_token != "" && req.headers.vendor_token != undefined) {
        // var search_string = 'SELECT *,(SELECT product_image_path FROM `product_images` where product_id =product.id AND image_position = "cover" LIMIT 0,1 ) AS cover_image_url FROM `product` where product.vendor_id = "' + req.vendor_id + '"  AND  ';
        var search_string = 'SELECT * FROM `product_view` where vendor_id = "' + req.vendor_id + '"  AND  ';
    } else {
        var search_string = '';
    }
    console.log(search_obj)

    for (var i = 0; i <= search_obj.length - 1; i++) {

        if (i >= 1) {
            if (i == 1) {
                if (req.body[search_obj[i]] != "") {
                    search_string += `name LIKE "%${req.body[search_obj[i]]}%" AND   `
                }
            } else {
                if (req.body[search_obj[i]] != "") {
                    var arr = JSON.stringify(req.body[search_obj[i]]);
                    var abc = "'" + arr + "'"
                    const id = abc.substring(abc.lastIndexOf("'[") + 2, abc.indexOf("]'"));
                    search_string += ' ' + search_obj[i] + ' IN ' + '(' + id + ') AND   '

                    // search_string+= `${search_obj[i]} = "${req.body[search_obj[i]]}" AND   `
                }

            }

        } else {
            // if (i > 1) {ORDER BY `product_view`.`id`  ASC
            if (search_obj[i] != undefined && req.body[search_obj[i]] != "") {
                search_string_asc_desc = ` ORDER BY product_view.${search_obj[i].replace("__", "")} ${req.body[search_obj[i]]} `
            }
            // }
        }
        if (i === search_obj.length - 1) {
            search_string = search_string.substring(0, search_string.length - 6);
            // search_string += search_string_asc_desc
            // if (search_obj[2] != undefined && req.body[search_obj[2]] != "") {
            // }

        }
    }
    console.log(search_string)
    var pg = req.query;
    var numRows;

    var numPerPage = pg.per_page;
    var page = parseInt(pg.page, pg.per_page) || 0;
    var numPages;
    var skip = page * numPerPage;
    // Here we compute the LIMIT parameter for MySQL query
    var limit = skip + "," + numPerPage;

    connection.query(
        "SELECT count(*) as numRows FROM product",
        (err, results) => {
            if (err) {
            } else {
                numRows = results[0].numRows;
                numPages = Math.ceil(numRows / numPerPage);
                var count_rows;
                connection.query(search_string.replace("*", "count(*) AS `count_rows` "),
                    (err, results) => {
                        console.log("results---------------------------------------")
                        console.log(results)
                        try {
                            count_rows = results[0]["count_rows"]
                        } catch (e) {
                            count_rows = "no"
                        }

                    })

                console.log("check_------------------------qyueryyyyy---545")
                console.log("" + search_string + "GROUP BY id " + search_string_asc_desc + " LIMIT " + limit + "")
                connection.query("" + search_string + "GROUP BY id " + search_string_asc_desc + " LIMIT " + limit + "",
                    (err, results) => {
                        if (err) {
                            console.log("err___________________194")
                            console.log(err)
                            res.status(200).send({ "response": "find error" });
                        } else {
                            // //console.log("_____")
                            var responsePayload = {
                                results: results,
                            };
                            if (page < numPages) {
                                responsePayload.pagination = {
                                    count_rows: count_rows,
                                    current: page,
                                    perPage: numPerPage,
                                    previous: page > 0 ? page - 1 : undefined,
                                    next: page < numPages - 1 ? page + 1 : undefined,
                                };
                            } else
                                responsePayload.pagination = {
                                    err:
                                        "queried page " +
                                        page +
                                        " is >= to maximum page number " +
                                        numPages,
                                };
                            res.status(200).send(responsePayload);
                        }
                    }
                );
            }
        }
    );
}

export function vendor_update_delivery_boy_pickuped_order(req, res) {
    console.log("vendor_update_delivery_boy_pickuped_order-------------------")
    let { order_id, pickuped } = req.body

    if (pickuped === "yes") {
        connection.query("UPDATE `order_delivery_details` SET `order_status`='pickuped' WHERE order_id='" + order_id + "'",
            (err, results) => {
                if (err) {
                    console.log("err___________________")
                    console.log(err)
                    res.status(200).send({ "response": "find error" });
                } else {
                    if (results["affectedRows"] >= 1) {
                        connection.query("UPDATE `order` SET `status_order`='pickuped' WHERE order_id='" + order_id + "'", (err, rows) => { console.log(rows) })
                        res.status(200).send({ "status": true, "response": "order status updated successfull" });
                    } else {
                        res.status(200).send({ "status": false, "response": "find error" });
                    }
                }
            })
    } else {
        res.status(200).send({ "status": false, "response": "accepted only yes in pickuped feild" });
    }

}
