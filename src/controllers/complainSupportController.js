import connection from "../../Db.js";
export function add_complain(req, res) {
    console.log("add_complain----------------------")
    var { order_id, first_name, last_name, contect_no, subject, email, description } = req.body
    //return false

    if (order_id) {
        connection.query("SELECT * FROM `order` WHERE order_id = '" + order_id + "'  ", async (error, rows, fields) => {
            if (rows != "") {
                var vendor_id = rows[0]["vendor_id"]
                connection.query("INSERT INTO `comaplains_support`(`order_id`, user_id, `first_name`, `last_name` , `contect_no`, `email`, `subject`,`description`,`asign_date`,`assigned_to`,`for_complain`) VALUES ('" + order_id + "','" + req.user_id + "','" + first_name + "','" + last_name + "','" + contect_no + "','" + email + "','" + subject + "','" + description + "','NOW()','" + vendor_id + "','order_related')", async (error, rows, fields) => {
                    if (error) {
                        //console.log("error"+err)
                        res.status(200).send({ "status": false, error })
                    } else {
                        //console.log("_____")
                        res.status(201).send({ "status": true, "Message": "Complaint Added" })

                    }
                })
            }
        })
    } else {
        connection.query("INSERT INTO `comaplains_support`(`order_id`, user_id, `first_name`, `last_name` , `contect_no`, `email`, `subject`,`description`,`for_complain`) VALUES ('" + order_id + "','" + req.user_id + "','" + first_name + "','" + last_name + "','" + contect_no + "','" + email + "','" + subject + "','" + description + "','other')", async (error, rows, fields) => {
            if (error) {
                //console.log("error"+err)
                res.status(200).send({ "status": false, error })
            } else {
                //console.log("_____")
                res.status(201).send({ "status": true, "Message": "Complaint Added" })

            }
        })
    }


}

export function complain_update(req, res) {
    //console.log("req.body")
    let complain_status = '';

    let query_ = ""
    let newdate = new Date();
    let complaint_newdate = newdate.getFullYear() + "-" + (newdate.getMonth() + 1) + "-" + newdate.
        getDate();
    if (req.headers.admin_token) {
        let { id, assigned_to, status } = req.body;
        if (assigned_to) {
            complain_status = status;
            query_ = "UPDATE `comaplains_support` SET `assigned_to`='" + assigned_to + "',`status_`='" + status + "',`asign_date`='" + complaint_newdate + "',`updated_on`='" + complaint_newdate + "' WHERE `id`= " + id + ""
        } else {
            complain_status = status;
            query_ = "UPDATE `comaplains_support` SET `status_`='" + status + "',`asign_date`='" + complaint_newdate + "',`updated_on`='" + complaint_newdate + "' WHERE `id`= " + id + ""
        }
    } else if (req.headers.vendor_token) {
        let { id, status, resolve_description } = req.body;
        complain_status = status;
        query_ = "UPDATE `comaplains_support` SET `resolve_date`='" + complaint_newdate + "',`status_`='" + status + "',`resolve_description`='" + resolve_description + "',`updated_on`='" + complaint_newdate + "' WHERE `id`= " + id + " AND `assigned_to`=" + req.vendor_id + " "
    } else {
        query_ = ""
    }
    console.log("----querry-check---" + query_)
    connection.query(query_, async (err, rows, fields) => {
        if (err) {
            console.log(err)
            res.status(200).send(err)
        } else {
            rows.affectedRows >= 1 ? res.status(200).send({ "status": false, "response": "Succesfully Update Complaint" }) : res.status(200).send({ "status": true, "response": "Faild Complaint Update", "complain_status": complain_status })
        }
    })
}

export function complain_search(req, res) {
    //console.log("req.body")
    let query_ = "SELECT * FROM `comaplains_support` WHERE "
    if (req.headers.admin_token) {
        let req_obj = req.body;
        if (Object.values(req_obj).every(element => element === "")) {
            query_ = "SELECT comaplains_support.*,`user`.`first_name` AS profile_first_name , `user`.`last_name` AS profile_last_name , `user`.`email` AS profile_email , `password`, `phone_no`, `pincode`, `city`, `address`, `alternate_address`, `image`, `token_for_notification`, `user_log`, `user_lat`, `alternetive_user_lat`, `alternetive_user_log` FROM `comaplains_support` LEFT JOIN `user` ON `comaplains_support`.`user_id` = `user`.`id` "
        } else {
            for (let k in req_obj) {
                if (k != "") {
                    query_ += " `" + k + "` = '" + req_obj[k] + "' "
                }
            }
        }

    } else if (req.headers.vendor_token) {
        let { status_ } = req.body;
        if (status_) {
            query_ = "SELECT * FROM `comaplains_support` WHERE `status_` = '" + status_ + "' AND `assigned_to` = '" + req.vendor_id + "'"
        } else {
            query_ = "SELECT * FROM `comaplains_support` WHERE `assigned_to` = '" + req.vendor_id + "'"
        }

    } else {
        if (req.headers.user_token) {
            let { status_ } = req.body;
            if (status_) {
                // query_ = "SELECT * FROM `comaplains_support` WHERE `status_` = '" + status_ + "' AND `assigned_to` = '" + req.user_id + "'"
                query_ = "SELECT * FROM `comaplains_support`  LEFT JOIN `user` ON `comaplains_support`.`user_id` = `user`.`id` WHERE  `comaplains_support`.`user_id` = '" + req.user_id + "' AND `status_` = '" + status_ + ""
            } else {
                query_ = "SELECT * FROM `comaplains_support`  LEFT JOIN `user` ON `comaplains_support`.`user_id` = `user`.`id` WHERE  `comaplains_support`.`user_id` = '" + req.user_id + "'"
            }

        }
    }

    console.log("----querry-check---" + query_)
    connection.query(query_, async (err, rows, fields) => {
        if (err) {
            console.log(err)
            res.status(200).send({ err })
        } else {
            console.log(rows)
            rows.length != "" ? res.status(200).send({ status: true, "result": rows }) : res.status(200).send({ status: false, "response": "not Found" })
        }
    })
}