import connection from "../../Db.js";
import {
  sendNotification,
  setNotification,
} from "../common/push_notification.js";
export function add_complain(req, res) {
  console.log("add_complain----------------------");
  var {
    order_id,
    first_name,
    last_name,
    contect_no,
    subject,
    email,
    description,
  } = req.body;
  //return false
  const inputDateTime = new Date();
  const offsetMinutes = inputDateTime.getTimezoneOffset();
  inputDateTime.setMinutes(inputDateTime.getMinutes() - offsetMinutes);

  const formattedDateTime = inputDateTime
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  console.log(formattedDateTime);
  if (order_id) {
    connection.query(
      "SELECT * FROM `order` WHERE order_id = '" + order_id + "'  ",
      async (error, rows, fields) => {
        console.log(error);
        if (rows != "") {
          var { vendor_id, user_id } = rows[0];

          connection.query(
            "SELECT * FROM `user` WHERE id = '" + user_id + "'  ",
            async (error, useData, fields) => {
              console.log(error);

              connection.query(
                "INSERT INTO `comaplains_support`(`order_id`, user_id, `first_name`, `last_name` , `contect_no`, `email`, `subject`,`description`,`asign_date`,`assigned_to`,`for_complain`, `created_on`) VALUES ('" +
                  order_id +
                  "','" +
                  req.user_id +
                  "','" +
                  useData[0]["first_name"] +
                  "','" +
                  useData[0]["last_name"] +
                  "','" +
                  useData[0]["phone_no"] +
                  "','" +
                  useData[0]["email"] +
                  "','" +
                  subject +
                  "','" + description.replace(/['"]/g, "\\$&")+
                      "','" +
                      formattedDateTime +
                      "','" +
                      vendor_id +
                      "','order_related','" +
                      formattedDateTime +
                      "')",
                async (error, rows, fields) => {
                  if (error) {
                    console.log(error);
                    res.status(200).send({ status: false, error });
                  } else {
                    //console.log("_____")
                    res
                      .status(201)
                      .send({ status: true, Message: "Complaint Added" });
                  }
                }
              );
            }
          );
        }
      }
    );
  } else {
    connection.query(
      "INSERT INTO `comaplains_support`(`order_id`, user_id, `first_name`, `last_name` , `contect_no`, `email`, `subject`,`description`,`for_complain`,`created_on`,`status_`) VALUES ('" +
        order_id +
        "','" +
        req.user_id +
        "','" +
        first_name +
        "','" +
        last_name +
        "','" +
        contect_no +
        "','" +
        email +
        "','" +
        subject +
        "','" +
        description.replace(/['"]/g, "\\$&") +
        "','other','" +
        formattedDateTime +
        "','pending')",
      async (error, rows, fields) => {
        if (error) {
          console.log(error);
          res.status(200).send({ status: false, error });
        } else {
          //console.log("_____")
          res.status(201).send({ status: true, Message: "Complaint Added" });
        }
      }
    );
  }
}

export function complain_update(req, res) {
  //console.log("req.body")
  let { id } = req.body;
  let complain_status = "pending";

  let query_ = "";
  let newdate = new Date();
  let complaint_newdate =
    newdate.getFullYear() +
    "-" +
    (newdate.getMonth() + 1) +
    "-" +
    newdate.getDate();
  if (req.headers.admin_token) {
    let { assigned_to, status } = req.body;
    if (assigned_to) {
      complain_status = status;
      query_ =
        "UPDATE `comaplains_support` SET `assigned_to`='" +
        assigned_to +
        "',`status_`='" +
        status +
        "',`asign_date`='" +
        complaint_newdate +
        "',`updated_on`='" +
        complaint_newdate +
        "' WHERE `id`= " +
        id +
        "";
    } else {
      complain_status = status;
      query_ =
        "UPDATE `comaplains_support` SET `status_`='" +
        status +
        "',`asign_date`='" +
        complaint_newdate +
        "',`updated_on`='" +
        complaint_newdate +
        "' WHERE `id`= " +
        id +
        "";
    }
  } else if (req.headers.vendor_token) {
    let { status, resolve_description } = req.body;
    complain_status = status;
    query_ =
      "UPDATE `comaplains_support` SET `resolve_date`='" +
      complaint_newdate +
      "',`status_`='" +
      status +
      "',`resolve_description`='" +
      resolve_description.replace(/['"]/g, "\\$&") +
      "',`updated_on`='" +
      complaint_newdate +
      "' WHERE `id`= " +
      id +
      " AND `assigned_to`=" +
      req.vendor_id +
      " ";
  } else {
    query_ = "";
  }
  console.log("----querry-check---" + query_);
  connection.query(query_, async (err, rows, fields) => {
    if (err) {
      console.log(err);
      res.status(200).send(err);
    } else {
      connection.query(
        "SELECT comaplains_support.*,token_for_notification FROM `comaplains_support`, `user` WHERE comaplains_support.user_id = user.id AND comaplains_support.id = " +
          id +
          "",
        (err, rows) => {
          let { token_for_notification, user_id } = rows[0];
          let notfData = {
            userDeviceToken: token_for_notification,
            notfTitle: "india ki nursery",
            notfMsg:
              "There have been changes to your complaint and support   Complaint/Support id :- " +
              id +
              " complaint/support status:- " +
              req.body.status +
              "",
            customData: {
              teest: "123123123",
            },
          };
          sendNotification(notfData);

          let notfDataForDB = {
            actor_id: user_id,
            actor_type: "user",
            message:
              "There have been changes to your complaint and support   Complaint/Support id :- " +
              id +
              " complaint/support status:- " +
              req.body.status +
              "",
            status: "unread",
            notification_title: "india ki nursery",
            notification_type: "complain",
            notification_type_id: id,
          };
          setNotification(notfDataForDB);
        }
      );
      rows.affectedRows >= 1
        ? res
            .status(200)
            .send({ status: true, response: "Succesfully Update Complaint" })
        : res.status(200).send({
            status: false,
            response: "Faild Complaint Update",
            complain_status: complain_status,
          });
    }
  });
}

export function complain_search(req, res) {
  //console.log("req.body")
  // let query_ = "SELECT * FROM `comaplains_support` WHERE "
  let query_ = "";
  if (req.headers.admin_token) {
    let req_obj = req.body;
    if (Object.values(req_obj).every((element) => element === "")) {
      query_ =
        "SELECT comaplains_support.id,order_id,user_id,comaplains_support.first_name,comaplains_support.last_name,contect_no,comaplains_support.email,subject,description,asign_date,assigned_to,resolve_date,status_,resolve_description,is_active,comaplains_support.created_on,comaplains_support.updated_on,for_complain,user.first_name AS profile_first_name,user.last_name AS profile_last_name,user.email AS profile_email ,phone_no,pincode,city,address,alternate_address,is_deleted,image,token_for_notification,user_type,user_log,user_lat,alternetive_user_lat,alternetive_user_log,active_address FROM `comaplains_support` JOIN `user` ON `comaplains_support`.`user_id` = `user`.`id` ";
    } else {
      query_ = "SELECT * FROM `comaplains_support` WHERE ";
      for (let k in req_obj) {
        if (k != "") {
          query_ += " `" + k + "` = '" + req_obj[k] + "' ";
        }
      }
    }
  } else if (req.headers.vendor_token) {
    let { status_ } = req.body;
    if (status_) {
      query_ =
        "SELECT * FROM `comaplains_support` WHERE `status_` = '" +
        status_ +
        "' AND `assigned_to` = '" +
        req.vendor_id +
        "'";
    } else {
      query_ =
        "SELECT * FROM `comaplains_support` WHERE `assigned_to` = '" +
        req.vendor_id +
        "'";
    }
  } else {
    if (req.headers.user_token) {
      let { status_ } = req.body;
      if (status_) {
        // query_ = "SELECT * FROM `comaplains_support` WHERE `status_` = '" + status_ + "' AND `assigned_to` = '" + req.user_id + "'"
        query_ =
          "SELECT comaplains_support.id,order_id,user_id,comaplains_support.first_name,comaplains_support.last_name,contect_no,comaplains_support.email,subject,description,asign_date,assigned_to,resolve_date,status_,resolve_description,is_active,comaplains_support.created_on,comaplains_support.updated_on,for_complain,user.first_name AS profile_first_name,user.last_name AS profile_last_name,user.email AS profile_email ,phone_no,pincode,city,address,alternate_address,is_deleted,image,token_for_notification,user_type,user_log,user_lat,alternetive_user_lat,alternetive_user_log,active_address FROM `comaplains_support` JOIN `user` ON `comaplains_support`.`user_id` = `user`.`id` WHERE  `comaplains_support`.`user_id` = '" +
          req.user_id +
          "' AND `status_` = '" +
          status_ +
          "' ORDER BY created_on DESC ";
      } else {
        query_ =
          "SELECT comaplains_support.id,order_id,user_id,comaplains_support.first_name,comaplains_support.last_name,contect_no,comaplains_support.email,subject,description,asign_date,assigned_to,resolve_date,status_,resolve_description,is_active,comaplains_support.created_on,comaplains_support.updated_on,for_complain,user.first_name AS profile_first_name,user.last_name AS profile_last_name,user.email AS profile_email ,phone_no,pincode,city,address,alternate_address,is_deleted,image,token_for_notification,user_type,user_log,user_lat,alternetive_user_lat,alternetive_user_log,active_address FROM `comaplains_support`  JOIN `user` ON `comaplains_support`.`user_id` = `user`.`id` WHERE  `comaplains_support`.`user_id` = '" +
          req.user_id +
          "' ORDER BY created_on DESC ";
      }
    }
  }

  console.log("----querry-check-222--" + query_);
  connection.query(query_, async (err, rows, fields) => {
    if (err) {
      console.log(err);
      res.status(200).send({ err });
    } else {
      // console.log(rows)
      rows.length != ""
        ? res.status(200).send({ status: true, result: rows })
        : res
            .status(200)
            .send({ status: true, response: "not Found", result: rows });
    }
  });
}
