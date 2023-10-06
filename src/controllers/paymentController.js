// const Razorpay = require('razorpay');
import Razorpay from "razorpay";
import connection from "../../Db.js";

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});
// var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })
("use strict");
export const createOrder = async (req, res) => {
  console.log("createOrder----------------------");
  let msgArray = Array();
  // req.user_id
  connection.query(
    "SELECT * FROM `user` WHERE `id` = '" + req.user_id + "'",
    (err, rows) => {
      if (err) {
        console.log(err);
        res.status(200).json({ status: false, message: "user not found" });
      } else {
        if (rows.length) {
          // res.status(200).json({"status":true,"message":"ok" ,"result":rows})
          try {
            const amount = req.body.amount * 100;
            const options = {
              amount: amount,
              currency: "INR",
              receipt: rows[0].email,
            };

            razorpayInstance.orders.create(options, (err, order) => {
              console.log("-------check--------");
              console.log("er---------------" + JSON.stringify(err));
              console.log("row--------------" + JSON.stringify(order));

              if (!err) {
                console.log(order);
                connection.query(
                  "INSERT INTO `transaction`(`user_id`, `payment_order_id`, `amount`, `is_payment_done`,`orders_group_id`) VALUES ('" +
                    req.user_id +
                    "','" +
                    order.id +
                    "','" +
                    req.body.amount +
                    "','pending','" +
                    req.body.orders_group_id +
                    "')",
                  (err, rows) => {
                    console.log(err);
                    if (err) {
                      msgArray.push(
                        "Transaction Successfull but Entry failed in table"
                      );
                    }
                    // connection.query(
                    //   "UPDATE `order` SET  `payment_status`='success' WHERE `orders_group_id`='" +
                    //     req.body.orders_group_id +
                    //     "'",
                    //   (err, rows) => {
                    //     if (!rows.affectedRows) {
                    //       msgArray.push(
                    //         "Transaction Successful But No payment_status Update"
                    //       );
                    //     }
                    //   }
                    // );

                    res.status(200).send({
                      success: true,
                      msg: "Order Created",
                      order_id: order.id,
                      amount: req.body.amount,
                      key_id: RAZORPAY_ID_KEY,
                      contact: "9827803082",
                      name: "mayur",
                      email: "mayur.we2code@gmail.com",
                      errorMsg: msgArray,
                      orders_group_id: req.body.orders_group_id,
                    });
                  }
                );
              } else {
                console.log("err----------------------79");
                console.log(err);
                res
                  .status(400)
                  .send({ success: false, msg: "Something went wrong!" });
              }
            });
          } catch (error) {
            console.log(error.message);
          }
        } else {
          res.status(200).json({ success: false, message: "user not found" });
        }
      }
    }
  );
};

export function paymentupdate(req, res) {
  let { payment_order_id, amount, orders_group_id, is_payment_done,payment_method,payment_id } = req.body;
  if (
    is_payment_done == "" ||
    !is_payment_done == "success" ||
    !is_payment_done == "failed"
  ) {
    is_payment_done = "panding";
  }


  if(payment_method == "cod"){
    connection.query(
      "UPDATE `transaction` SET `is_payment_done`='failed' WHERE user_id='" +
        req.user_id +
        "' AND orders_group_id='" +
        orders_group_id +
        "'",
      (err, rows) => {
        if (err) {
          console.log(err);
          res.status(200).send({
            success: false,
            msg: "Find Some Error",
          });
        } else {
          if (rows.affectedRows) {
            connection.query(
              "UPDATE `order` SET `payment_status`='" +
                is_payment_done +
                "' ,`payment_mode`='"+payment_method+"' WHERE user_id='" +
                req.user_id +
                "' AND `orders_group_id`='" +
                req.body.orders_group_id +
                "'",
              (err, rows) => {
                if (err) {
                  console.log(err);
                  res.status(200).send({
                    success: false,
                    msg: "Find Some Error",
                  });
                } else {
                  if (rows.affectedRows) {
                    res.status(200).send({
                      success: true,
                      msg: "Order Payment-Status Updated successfully.",
                    });
                  } else {
                    res.status(200).send({
                      success: false,
                      msg: "No Payment Status Update",
                    });
                  }
                }
              }
            );
          } else {
            res.status(200).send({
              success: false,
              msg: "No Data Found",
            });
          }
        }
      }
    );
  }else{
    connection.query(
      "UPDATE `transaction` SET `is_payment_done`='" +
        is_payment_done +
        "',`payment_id`='" +
        payment_id +
        "' WHERE user_id='" +
        req.user_id +
        "' AND amount='" +
        amount +
        "'  AND orders_group_id='" +
        orders_group_id +
        "' AND is_payment_done='pending' AND payment_order_id = '"+payment_order_id+"' ",
      (err, rows) => {
        if (err) {
          console.log(err);
          res.status(200).send({
            success: false,
            msg: "Find Some Error",
          });
        } else {
          if (rows.affectedRows) {
            connection.query(
              "UPDATE `order` SET `payment_status`='" +
                is_payment_done +
                "',`payment_mode`='"+payment_method+"' WHERE user_id='" +
                req.user_id +
                "' AND `orders_group_id`='" +
                req.body.orders_group_id +
                "'",
              (err, rows) => {
                if (err) {
                  console.log(err);
                  res.status(200).send({
                    success: false,
                    msg: "Find Some Error",
                  });
                } else {
                  if (rows.affectedRows) {
                    res.status(200).send({
                      success: true,
                      msg: "Order Payment-Status Updated successfully.",
                    });
                  } else {
                    res.status(200).send({
                      success: false,
                      msg: "No Payment Status Update",
                    });
                  }
                }
              }
            );
          } else {
            res.status(200).send({
              success: false,
              msg: "No Data Found",
            });
          }
        }
      }
    );
  }
}

export function paymentDetails(req, res) {
  if (req.body.payment_id) {
    //         try{
    //             const razorpayInstance1 = new Razorpay({
    //                 key_id: RAZORPAY_ID_KEY,
    //                 key_secret: RAZORPAY_SECRET_KEY
    //             });
    //             razorpayInstance1.payments.fetch(req.body.payment_id,  (err, respo)=>{
    //             console.log(err)
    //             console.log(respo)
    //             })
    //             // console.log(JSON.stringify(response_))
    //         // res.send(response_)
    //         }catch(e){
    // console.log(e)
    // res.send(e)
    //         }
  } else {
    res.status(200).send({ status: false, message: "please fill payment-id" });
  }
}


export function reDataFetch(req, res) {
  let { orders_group_id} = req.body;
 let resData={};
  connection.query("SELECT * FROM transaction WHERE user_id = '"+req.user_id+"' AND orders_group_id = '"+orders_group_id+"' AND (is_payment_done ='pending' OR is_payment_done ='failed') " , (err,results)=>{
  try { resData["transactionDetaile"]=results[0]}catch(e){}
    if(err){
      console.log(err)
      res.status(200).send({status:false,statusMsg:"find some error"})
    }else{
      connection.query("SELECT * FROM `order` WHERE user_id = '"+req.user_id+"' AND orders_group_id = '"+orders_group_id+"' AND (payment_status ='pending' OR payment_status ='failed')" , (err,result_1)=>{
        resData["orderDetaile"]=result_1
        if(err){
      console.log(err)
          res.status(200).send({status:false,statusMsg:"find some error"})
        }else{ 
        res.status(200).send({status:true,statusMsg:"ok",result:resData})
        }
      })
    }
  })
}