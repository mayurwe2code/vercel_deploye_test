
import connection from "../../Db.js";

export function vendor_select_area(req, res) {
    console.log(req.body)
    let respo_array = []
    let { pin } = req.body
    connection.query("SELECT * FROM `vendor_service_area` where pin = " + pin + "", (err, rows, fields) => {
        if (err) {
            console.log(err)
            res.status(200).send({ "status": false, "response": "find some error" })
        } else {
            // res.status(200).send({ "status": true, "response": rows })
            console.log(rows.length)
            let pin_area_length = rows.length
            if (rows.length) {
                rows.forEach((item, index) => {
                    let { area_id, pin, city, status, area_name, vendors_id } = item

                    // let { area_id, pin, city, status, area_name, vendors_id } = rows[0]
                    let st = vendors_id.substring(0, vendors_id.length - 1)
                    let vendors_id_array = st.split(",");
                    if (vendors_id_array.includes(`${req.vendor_id}`)) {
                        if (index === pin_area_length - 1) {
                            res.status(200).json({ status: true, response: "already selected", your_service_area_list: respo_array })
                        }
                    } else {
                        let new_str = vendors_id + req.vendor_id + ", "
                        //=====================================================================
                        connection.query("UPDATE `vendor_service_area` SET `vendors_id` ='" + new_str + "' where area_id = " + area_id + "", (err, rows, fields) => {
                            if (err) {
                                console.log(err)
                                // res.status(200).send({ "status": false, "response": "find some error" })
                                // res.status(200).json({ status: false, response: "succefull added your sevice area", your_service_area_list: respo_array })
                                if (index === pin_area_length - 1) {
                                    res.status(200).json({ status: false, response: "find some error" })
                                }
                            } else {
                                // res.status(200).send({ "status": true, "response": "add service area successfull" })
                                respo_array.push({ area_id, pin, city, status, area_name })
                                if (index === pin_area_length - 1) {
                                    res.status(200).json({ status: true, response: "succefull added your sevice area", your_service_area_list: respo_array })
                                }
                            }
                        })
                        console.log("false------------------------")
                    }
                });

            } else {
                res.status(200).send({ "status": false, "response": "area_id not matched" })
            }

        }
    })
}
export function vendor_service_area_list(req, res) {
    let query_ = "SELECT * FROM `vendor_service_area` WHERE status = 1 "
    console.log(req.body)
    for (let k in req.body) {
        query_ += `AND  ${k} LIKE '%${req.body[k]}%'`
    }
    console.log(query_ + "group by pin")
    // return false
    connection.query(query_ + "group by pin", (err, rows, fields) => {
        if (err) {
            console.log(err)
            res.status(200).send({ "status": false, "response": "find some error" })
        } else {
            // res.status(200).send({ "status": true, "response": rows })
            console.log(rows)
            res.status(200).send({ "status": true, "response": rows })

        }
    })
}

export function check_vendor_service_avaibility(req, res) {
    console.log("check_vendor_service_avaibility------------")
    let { pin, vendor_id } = req.body


    connection.query("SELECT * FROM `vendor_service_area` where pin = " + pin + "", (err, rows, fields) => {
        if (err) {
            console.log(err)
            res.status(200).send({ "status": false, "response": "find some error" })
        } else {
            // res.status(200).send({ "status": true, "response": rows })
            console.log(rows.length)
            let pin_area_length = rows.length
            if (rows.length) {
                rows.forEach((item, index) => {
                    let { area_id, pin, city, status, area_name, vendors_id } = item

                    // let { area_id, pin, city, status, area_name, vendors_id } = rows[0]
                    let st = vendors_id.substring(0, vendors_id.length - 1)
                    let vendors_id_array = st.split(",");
                    console.log("vendors_id_array------------")
                    console.log(vendors_id_array)


                    // var array = [1, 2, 3, 4, 5];
                    // var valuesToCheck = [2, 4, 6];

                    var presentValues = vendor_id.filter(value => vendors_id_array.includes(value));
                    var absentValues = vendor_id.filter(value => !vendors_id_array.includes(value));

                    console.log(presentValues); // Output: [2, 4]
                    console.log(absentValues); // Output: [6]

                    if (index === pin_area_length - 1) {
                        res.status(200).json({ "status": true, "service_availabe": presentValues, "service_not_availabe": absentValues })
                    }


                    // if (vendors_id_array.includes(vendor_id)) {
                    //     if (index === pin_area_length - 1) {
                    //         res.status(200).json({ status: true, response: "Service available in this pin" })
                    //     }
                    // } else {
                    //     if (index === pin_area_length - 1) {
                    //         res.status(200).json({ status: false, response: "Service Not available in this pin" })
                    //     }
                    // }
                });
            } else {
                res.status(200).send({ "status": false, "response": "area_id not matched" })
            }

        }
    })

}