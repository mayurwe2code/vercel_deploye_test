export async function add_order_1(req, res) {
  const orders_group_id =
    Date.now().toString(36) + Math.random().toString(36).replace(".", "");
  let payment_method = req.body["payment_method"];
  const currentDate = new Date();
  const futureDate = new Date(currentDate);
  futureDate.setDate(currentDate.getDate() + 7);
  const formattedDateTime = futureDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  let order_placed = [];
  let order_array = req.body["order"];
  let {
    first_name,
    last_name,
    email,
    phone_no,
    image,
    pincode,
    city,
    address,
    user_log,
    user_lat,
    replace_address,
  } = req.body["delivery_address"];

  if (replace_address) {
    connection.query(
      "UPDATE `user` SET `pincode`='" +
        pincode +
        "',`city`='" +
        city +
        "',`address`='" +
        address +
        "',`user_log`='" +
        user_log +
        "',`user_lat`='" +
        user_lat +
        "' WHERE id='" +
        req.user_id +
        "'",
      (err, result) => {
        if (err) {
          console.log("err update address");
          console.log(err);
        }
      }
    );
  }

  var fcm_tokens = [];
  let response_send = [];
  let all_orders_total = 0,
    all_orders_total_gst = 0,
    all_orders_total_sgst = 0,
    all_orders_total_cgst = 0,
    all_orders_total_discount = 0,
    admin_commission_amount = 0,
    Price_after_removing_admin_commission = 0;
  connection.query(
    "SELECT * FROM user WHERE id='" + req.user_id + "'",
    (err, result) => {
      if (err) {
      } else {
        if (
          result[0].token_for_notification != "" &&
          result[0].token_for_notification != undefined &&
          result[0].token_for_notification != null
        ) {
          fcm_tokens.push(result[0].token_for_notification);
        }
        //-------------------------------------start---new----update----------------------------------------
        order_array.forEach((element_1, count) => {
          let cart_id_array = [];
          let { vendor_id, coupan_code } = element_1;
          const curr_date = new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
          connection.query(
            "SELECT * FROM `used_coupan_by_users` WHERE `coupan_code` = '" +
              coupan_code +
              "' AND `user_id` = '" +
              req.user_id +
              "'",
            (err, coupan_check) => {
              if (err) {
              } else {
                console.log("coupan_check============");
                console.log(coupan_check);
                if (coupan_check != "") {
                  // already used by user
                } else {
                  connection.query(
                    "SELECT * FROM `coupons` where start_date <='" +
                      curr_date +
                      "' AND end_date >='" +
                      curr_date +
                      "' AND code ='" +
                      coupan_code +
                      "'",
                    (err, rows_coup) => {
                      if (err) {
                      } else {
                        // connection.query("SELECT admin_commission FROM `vendor` where vendor.vendor_id = "+vendor_id+"", (err, vendo_pro) => {})

                        connection.query(
                          'select cart.id,user_id,cart.product_id AS cart_product_id ,cart.product_verient_id AS cart_product_verient_id ,cart_product_quantity,cart.created_on AS cart_created_on,cart.updated_on AS cart_updated_on,product_view.*, (SELECT owner_name FROM `vendor` where vendor.vendor_id = product_view.vendor_id) AS owner_name,(SELECT admin_commission FROM `vendor` where vendor.vendor_id = product_view.vendor_id) AS admin_commission from cart,product_view where cart.product_verient_id = product_view.product_verient_id AND user_id="' +
                            req.user_id +
                            '" AND verient_is_deleted="0" AND product_view.vendor_id = "' +
                            vendor_id +
                            '"',
                          (err, results) => {
                            if (err) {
                            } else {
                              let products = [];

                              let total_sgst = 0,
                                total_cgst = 0,
                                total_gst = 0,
                                taxable_amaount = 0,
                                sub_total = 0,
                                total_mrp = 0,
                                total_discount = 0,
                                total_delivery_charge = 0,
                                coupan_discount = 0,
                                coupan_discount_price = 0;
                              let price_x_cart_qty = 0,
                                mrp_x_cart_qty = 0,
                                gst_amount = 0,
                                discount_amount = 0,
                                sgst_amount = 0,
                                cgst_amount = 0,
                                order_product_count = 0;
                              results.forEach((element, index) => {
                                price_x_cart_qty =
                                  element["price"] *
                                  element["cart_product_quantity"];
                                mrp_x_cart_qty =
                                  element["mrp"] *
                                  element["cart_product_quantity"];
                                // price_x_cart_qty / (1 + (element["gst"] / 100))
                                gst_amount =
                                  price_x_cart_qty / (1 + element["gst"] / 100);
                                sgst_amount =
                                  price_x_cart_qty /
                                  (1 + element["sgst"] / 100);
                                cgst_amount =
                                  price_x_cart_qty /
                                  (1 + element["cgst"] / 100);
                                discount_amount =
                                  (mrp_x_cart_qty * element["discount"]) / 100;

                                element["price_x_cart_qty"] = price_x_cart_qty;
                                element["mrp_x_cart_qty"] = mrp_x_cart_qty;
                                element["cart_taxable_amount"] = gst_amount;
                                element["cart_gst_amount"] =
                                  price_x_cart_qty - gst_amount;
                                element["cart_sgst_amount"] =
                                  price_x_cart_qty - sgst_amount;
                                element["cart_cgst_amount"] =
                                  price_x_cart_qty - cgst_amount;
                                element["cart_discount_amount"] =
                                  discount_amount;
                                taxable_amaount += gst_amount;
                                total_gst += price_x_cart_qty - gst_amount;
                                total_sgst += price_x_cart_qty - sgst_amount;
                                total_cgst += price_x_cart_qty - cgst_amount;
                                sub_total += price_x_cart_qty;
                                total_mrp += mrp_x_cart_qty;
                                total_discount += discount_amount;
                                total_delivery_charge = 100;
                                order_product_count += 1;
                                if (index == results.length - 1) {
                                  let orderno = Math.floor(
                                    100000 + Math.random() * 900000
                                  );
                                  let verify_code = Math.floor(
                                    100000 + Math.random() * 900000
                                  );
                                  all_orders_total += sub_total;
                                  all_orders_total_gst += total_gst;
                                  all_orders_total_sgst += total_sgst;
                                  all_orders_total_cgst += total_cgst;
                                  all_orders_total_discount += total_discount;
                                  // console.log(rows_coup)
                                  try {
                                    coupan_discount =
                                      (sub_total * rows_coup[0]["percentage"]) /
                                      100;
                                    coupan_discount_price =
                                      sub_total - coupan_discount;
                                  } catch (e) {
                                    coupan_discount = 0;
                                    coupan_discount_price = sub_total;
                                  }
                                  admin_commission_amount =
                                    (coupan_discount_price *
                                      element["admin_commission"]) /
                                    100;
                                  Price_after_removing_admin_commission =
                                    coupan_discount_price -
                                    admin_commission_amount;
                                  console.log(
                                    "insert into `order` ( `order_id`, `product_id`,`user_id`, vendor_id, `total_order_product_quantity`,`total_amount`,`total_gst`,`total_cgst`, `total_sgst`,`total_discount`, `shipping_charges`,`invoice_id`, `payment_mode`,`payment_ref_id`,`delivery_date`, `discount_coupon`,`discount_coupon_value`,`delivery_lat`,`delivery_log`, `user_name`, `address`, `email`, `pin_code`, `city`, `user_image`, `phone_no`,`delivery_verify_code`, `only_this_order_product_total`, `only_this_order_product_quantity`, `only_this_product_gst`, `only_this_product_cgst`, `only_this_product_sgst`,`admin_commission_parcent`,`Price_after_removing_admin_commission`,`admin_commission_amount`,`payment_status`,`orders_group_id`) VALUES ('" +
                                      orderno +
                                      "','" +
                                      element["product_id"] +
                                      "','" +
                                      req.user_id +
                                      "', '" +
                                      vendor_id +
                                      "', '" +
                                      results["length"] +
                                      "','" +
                                      all_orders_total +
                                      "','" +
                                      all_orders_total_gst +
                                      "','" +
                                      all_orders_total_cgst +
                                      "','" +
                                      all_orders_total_sgst +
                                      "','" +
                                      total_discount +
                                      "','" +
                                      total_delivery_charge +
                                      "','" +
                                      orderno +
                                      "','" +
                                      payment_method +
                                      "','121212','" +
                                      formattedDateTime +
                                      "','" +
                                      coupan_code +
                                      "','" +
                                      coupan_discount +
                                      "'," +
                                      user_lat +
                                      "," +
                                      user_log +
                                      ", '" +
                                      first_name +
                                      "', '" +
                                      address +
                                      "', '" +
                                      email +
                                      "', " +
                                      pincode +
                                      ", '" +
                                      city +
                                      "', '" +
                                      image +
                                      "','" +
                                      phone_no +
                                      "' ,'" +
                                      verify_code +
                                      "','" +
                                      coupan_discount_price +
                                      "','" +
                                      order_product_count +
                                      "','" +
                                      total_gst +
                                      "','" +
                                      total_cgst +
                                      "','" +
                                      total_sgst +
                                      "','" +
                                      element["admin_commission"] +
                                      "','" +
                                      Price_after_removing_admin_commission +
                                      "','" +
                                      admin_commission_amount +
                                      "','pending','" +
                                      orders_group_id +
                                      "')"
                                  );
                                  connection.query(
                                    "insert into `order` ( `order_id`, `product_id`,`user_id`, vendor_id, `total_order_product_quantity`,`total_amount`,`total_gst`,`total_cgst`, `total_sgst`,`total_discount`, `shipping_charges`,`invoice_id`, `payment_mode`,`payment_ref_id`,`delivery_date`, `discount_coupon`,`discount_coupon_value`,`delivery_lat`,`delivery_log`, `user_name`, `address`, `email`, `pin_code`, `city`, `user_image`, `phone_no`,`delivery_verify_code`, `only_this_order_product_total`, `only_this_order_product_quantity`, `only_this_product_gst`, `only_this_product_cgst`, `only_this_product_sgst`,`admin_commission_parcent`,`Price_after_removing_admin_commission`,`admin_commission_amount`,`payment_status`,`orders_group_id`) VALUES ('" +
                                      orderno +
                                      "','" +
                                      element["product_id"] +
                                      "','" +
                                      req.user_id +
                                      "', '" +
                                      vendor_id +
                                      "', '" +
                                      results["length"] +
                                      "','" +
                                      all_orders_total +
                                      "','" +
                                      all_orders_total_gst +
                                      "','" +
                                      all_orders_total_cgst +
                                      "','" +
                                      all_orders_total_sgst +
                                      "','" +
                                      total_discount +
                                      "','" +
                                      total_delivery_charge +
                                      "','" +
                                      orderno +
                                      "','" +
                                      payment_method +
                                      "','121212','" +
                                      formattedDateTime +
                                      "','" +
                                      coupan_code +
                                      "','" +
                                      coupan_discount +
                                      "'," +
                                      user_lat +
                                      "," +
                                      user_log +
                                      ", '" +
                                      first_name +
                                      "', '" +
                                      address +
                                      "', '" +
                                      email +
                                      "', " +
                                      pincode +
                                      ", '" +
                                      city +
                                      "', '" +
                                      image +
                                      "','" +
                                      phone_no +
                                      "' ,'" +
                                      verify_code +
                                      "','" +
                                      coupan_discount_price +
                                      "','" +
                                      order_product_count +
                                      "','" +
                                      total_gst +
                                      "','" +
                                      total_cgst +
                                      "','" +
                                      total_sgst +
                                      "','" +
                                      element["admin_commission"] +
                                      "','" +
                                      Price_after_removing_admin_commission +
                                      "','" +
                                      admin_commission_amount +
                                      "','pending','" +
                                      orders_group_id +
                                      "')",
                                    (err, rows) => {
                                      if (err) {
                                        console.log(err);
                                        if (order_array.length - 1 == count) {
                                          console.log("order ready ya aaaa");
                                          res.json({
                                            orders_group_id,
                                            payment_method,
                                            status: true,
                                            response:
                                              "Thank you for your order! Your order has been received and is being processed",
                                            order_placed,
                                          });
                                        }
                                      } else {
                                        // cosnole.log(rows);
                                        order_placed.push(orderno);

                                        let notfDataForDB = {
                                          actor_id: req.user_id,
                                          actor_type: "user",
                                          message:
                                            "Thank you for your order! Your order " +
                                            orderno +
                                            " has been received and is being processed",
                                          status: "unread",
                                          notification_title:
                                            "india ki nursery",
                                          notification_type: "order",
                                          notification_type_id: orderno,
                                        };
                                        setNotification(notfDataForDB);

                                        connection.query(
                                          "SELECT * FROM user WHERE id = " +
                                            req.user_id +
                                            "",
                                          (err, rows) => {
                                            let { token_for_notification } =
                                              rows[0];
                                            var notfData = {
                                              userDeviceToken:
                                                token_for_notification,
                                              notfTitle: "india ki nursery",
                                              notfMsg:
                                                "Thank you for your order! Your order " +
                                                orderno +
                                                " has been received and is being processed",
                                              customData: {
                                                teest: "123123123",
                                              },
                                            };
                                            sendNotification(notfData);
                                          }
                                        );

                                        let notfDataForDB1 = {
                                          actor_id: vendor_id,
                                          actor_type: "vendor",
                                          message:
                                            "order recived " +
                                            orderno +
                                            " by " +
                                            first_name +
                                            " - user_id " +
                                            req.user_id +
                                            "",
                                          status: "unread",
                                          notification_title:
                                            "india ki nursery",
                                          notification_type: "order",
                                          notification_type_id: orderno,
                                        };
                                        setNotification(notfDataForDB1);

                                        const mail_configs = {
                                          from: "mayur.we2code@gmail.com",
                                          to: email,
                                          subject: "order placed successfull",
                                          text: "order placed successfull",
                                          html:
                                            "<h1>Thank you for your order! Your order " +
                                            orderno +
                                            " has been received and is being processed <h1/> <br> <h3> order_id - " +
                                            orderno +
                                            " </h3> <br> <h3> delivery_verification_otp - " +
                                            verify_code +
                                            " </h3> ",
                                        };
                                        nodemailer
                                          .createTransport({
                                            service: "gmail",
                                            auth: {
                                              user: "mayur.we2code@gmail.com",
                                              pass: "tozuskyqbgojopbs",
                                            },
                                          })
                                          .sendMail(mail_configs, (err) => {
                                            if (err) {
                                              console.log(err);
                                              return; //console.log({ "email_error": err });
                                            } else {
                                              return {
                                                send_mail_status:
                                                  "send successfully",
                                              };
                                            }
                                          });

                                        if (order_array.length - 1 == count) {
                                          console.log("order ready ya aaaa");

                                          res.json({
                                            status: true,
                                            orders_group_id,
                                            payment_method,
                                            response:
                                              "Thank you for your order! Your order has been received and is being processed",
                                            order_placed,
                                          });
                                        }
                                        if (results != "") {
                                          if (0 < coupan_discount) {
                                            connection.query(
                                              "INSERT INTO `used_coupan_by_users`(`coupan_code`, `user_id`, `order_id`) VALUES ('" +
                                                coupan_code +
                                                "','" +
                                                req.user_id +
                                                "','" +
                                                orderno +
                                                "')"
                                            );
                                          }
                                        } else {
                                        }
                                        console.log(
                                          "order_insert_successfull--------" +
                                            results
                                        );
                                        results.forEach((item_, index_) => {
                                          let update_stock_qty =
                                            item_["product_stock_quantity"] -
                                            item_["cart_product_quantity"];

                                          connection.query(
                                            "UPDATE `product_verient` SET product_stock_quantity='" +
                                              update_stock_qty +
                                              "' WHERE product_verient_id='" +
                                              item_["product_verient_id"] +
                                              "'"
                                          );
                                          connection.query(
                                            'INSERT INTO order_detaile1 (`id`, `order_id`, `order_cart_count`, `vendor_id`, `name`, `seo_tag`, `brand`, `category`, `is_deleted`, `status`, `review`, `rating`, `description`, `is_active`, `created_by`, `created_by_id`, `created_on`, `updated_on`, `product_verient_id`, `product_id`, `verient_name`, `quantity`, `unit`, `product_stock_quantity`, `price`, `mrp`, `gst`, `sgst`, `cgst`, `verient_is_deleted`, `verient_status`, `discount`, `verient_description`, `verient_is_active`, `verient_created_on`, `verient_updated_on`, `product_height`, `product_width`, `product_Weight`, `all_images_url`, `cover_image`) SELECT `id`, "' +
                                              orderno +
                                              '", "' +
                                              item_["cart_product_quantity"] +
                                              '", `vendor_id`, `name`, `seo_tag`, `brand`, `category`, `is_deleted`, `status`, `review`, `rating`, `description`, `is_active`, `created_by`, `created_by_id`, `created_on`, `updated_on`, `product_verient_id`, `product_id`, `verient_name`, `quantity`, `unit`, `product_stock_quantity`, `price`, `mrp`, `gst`, `sgst`, `cgst`, `verient_is_deleted`, `verient_status`, `discount`, `verient_description`, `verient_is_active`, `verient_created_on`, `verient_updated_on`, `product_height`, `product_width`, `product_Weight`, `all_images_url`, `cover_image` FROM	product_view WHERE product_verient_id = ' +
                                              item_["product_verient_id"] +
                                              ""
                                          );
                                          connection.query(
                                            "delete from cart where product_verient_id ='" +
                                              item_["product_verient_id"] +
                                              "' AND user_id='" +
                                              req.user_id +
                                              "'"
                                          );
                                        });
                                      }

                                      if (order_array.length - 1 == count) {
                                        // connection.query('INSERT INTO `notification`(`actor_id`, `actor_type`, `message`, `status`) VALUES ("' + req.user_id + '","user","successfully placed order,order_no=","unread"),("001","admin","recived order (order_no. =) by ' + first_name + ', user_id ' + req.user_id + '","unread")', (err, rows) => {
                                        //   if (err) {
                                        //     //console.log({ "notification": err })
                                        //   } else {
                                        //     console.log("_______notification-send__94________")
                                        //   }
                                        // })
                                        // const mail_configs = {
                                        //   from: 'rahul.verma.we2code@gmail.com',
                                        //   to: email,
                                        //   subject: 'order status ',
                                        //   text: "order added successfully",
                                        //   html: "<h1>order added successfully<h1/>"
                                        // }
                                        // nodemailer.createTransport({
                                        //   service: 'gmail',
                                        //   auth: {
                                        //     user: "rahul.verma.we2code@gmail.com",
                                        //     pass: "sfbmekwihdamgxia",
                                        //   }
                                        // })
                                        //   .sendMail(mail_configs, (err) => {
                                        //     if (err) {
                                        //       return //console.log({ "email_error": err });
                                        //     } else {
                                        //       return { "send_mail_status": "send successfully" };
                                        //     }
                                        //   })
                                      }
                                    }
                                  );
                                }
                              });
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            }
          );
        });
      }
    }
  );
}
