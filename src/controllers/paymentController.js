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
              if (!err) {
                console.log(order);
                connection.query(
                  "INSERT INTO `transaction`(`user_id`, `payment_order_id`, `amount`, `is_payment_done`) VALUES ('" +
                    req.user_id +
                    "','" +
                    order.id +
                    "','" +
                    req.body.amount +
                    "','true')",
                  (err, rows) => {
                    console.log(err);
                    res.status(200).send({
                      success: true,
                      msg: "Order Created",
                      order_id: order.id,
                      amount: amount,
                      key_id: RAZORPAY_ID_KEY,
                      contact: "9827803082",
                      name: "mayur",
                      email: "mayur.we2code@gmail.com",
                    });
                  }
                );
              } else {
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
