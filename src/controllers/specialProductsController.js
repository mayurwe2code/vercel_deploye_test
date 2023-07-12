import connection from "../../Db.js";

export function trending_products(req, res) {
  console.log(req.body)
  let { from_date, to_date, from_price, to_price, order_by } = req.body;
  let query_ = "";
  console.log(req.user_id)
  if (req.user_id != "" && req.user_id != undefined) {
    query_ = 'SELECT COUNT(`order`.product_id) AS sale_count, `order`.product_id, `order`.created_on,`product_view`.`id`,`product_view`.`vendor_id`,`product_view`.`name`,`product_view`.`seo_tag`,`product_view`.`brand`,`product_view`.`category`,`product_view`.`is_deleted`,`product_view`.`status`,`product_view`.`review`,`product_view`.`rating`,`product_view`.`description`,`product_view`.`is_active`,`product_view`.`created_by`,`product_view`.`created_by_id`,`product_view`.`created_on`,`product_view`.`updated_on`,`product_view`.`product_verient_id`,`product_view`.`product_id`,`product_view`.`verient_name`,`product_view`.`quantity`,`product_view`.`unit`,`product_view`.`product_stock_quantity`,`product_view`.`price`,`product_view`.`mrp`,`product_view`.`gst`,`product_view`.`sgst`,`product_view`.`cgst`,`product_view`.`verient_is_deleted`,`product_view`.`verient_status`,`product_view`.`discount`,`product_view`.`verient_description`,`product_view`.`verient_is_active`,`product_view`.`verient_created_on`,`product_view`.`verient_updated_on`,`product_view`.`product_height`,`product_view`.`product_width`,`product_view`.`product_Weight`,`product_view`.`cover_image`,`product_view`.`all_images_url`,`product_view`.`avgRatings` ,(SELECT cart_product_quantity FROM cart WHERE cart.product_verient_id = product_view.product_verient_id AND user_id = "' + req.user_id + '") AS cart_count  FROM `order` LEFT JOIN `product_view` ON `order`.product_id = `product_view`.product_id WHERE '
  } else {
    query_ = 'SELECT COUNT(`order`.product_id) AS sale_count, `order`.product_id, `order`.created_on,`product_view`.`id`,`product_view`.`vendor_id`,`product_view`.`name`,`product_view`.`seo_tag`,`product_view`.`brand`,`product_view`.`category`,`product_view`.`is_deleted`,`product_view`.`status`,`product_view`.`review`,`product_view`.`rating`,`product_view`.`description`,`product_view`.`is_active`,`product_view`.`created_by`,`product_view`.`created_by_id`,`product_view`.`created_on`,`product_view`.`updated_on`,`product_view`.`product_verient_id`,`product_view`.`product_id`,`product_view`.`verient_name`,`product_view`.`quantity`,`product_view`.`unit`,`product_view`.`product_stock_quantity`,`product_view`.`price`,`product_view`.`mrp`,`product_view`.`gst`,`product_view`.`sgst`,`product_view`.`cgst`,`product_view`.`verient_is_deleted`,`product_view`.`verient_status`,`product_view`.`discount`,`product_view`.`verient_description`,`product_view`.`verient_is_active`,`product_view`.`verient_created_on`,`product_view`.`verient_updated_on`,`product_view`.`product_height`,`product_view`.`product_width`,`product_view`.`product_Weight`,`product_view`.`cover_image`,`product_view`.`all_images_url`,`product_view`.`avgRatings` FROM `order` LEFT JOIN `product_view` ON `order`.product_id = `product_view`.product_id WHERE '
  }

  if (from_date && to_date) {
    query_ += '`order`.created_on BETWEEN "' + from_date + ' 12:00:00" AND "' + to_date + ' 23:59:00"'
  } else {
    var today = new Date();
    var sevenDaysAgo = new Date(today);
    to_date = today.toISOString().slice(0, 19).replace("T", " ");
    sevenDaysAgo.setDate(today.getDate() - 30);
    from_date = sevenDaysAgo.toISOString().slice(0, 19).replace("T", " ");
    query_ += "`order`.created_on BETWEEN '" + from_date + "' AND '" + to_date + "'"
  }
  if (from_price && to_price) {
    query_ += ' AND `product_view`.price BETWEEN "' + from_price + '" AND "' + to_price + '"'
  }

  for (let k in req.body) {
    if (k != "from_date" && k != "to_date" && k != "from_price" && k != "to_price" && k != "order_by") {
      query_ += ` AND product_view.${k} = '${req.body[k]}'`
    } else {

    }
  }
  let order_by_ = ""
  if (order_by) {
    order_by_ = ` ORDER BY ${order_by} `
  } else {
    order_by_ = ` ORDER BY sale_count DESC `
  }

  console.log(query_ + " GROUP BY `order`.product_id" + order_by_ + "")
  connection.query(query_ + ' GROUP BY `order`.product_id' + order_by_ + '', (err, rows) => {
    if (err) {
      console.log(err)
      res.status(200)
        .json({ status: false, message: "something went wrong" });
    } else {
      res.status(200).json({ status: true, results: rows });
    }
  });
}

export function add_fetured_product(req, res) {
  //console.log("req.body")
  var { product_id, fetured_type, start_date, end_date } = req.body

  connection.query('SELECT * FROM `fetured_product_table` WHERE `product_id`="' + product_id + '" AND `fetured_type`="' + fetured_type + '" AND is_deleted="1"', (err, rows, fields) => {
    if (err) {
      //console.log("/fetured_product" + err)
      res.status(200).send(err)
    } else {
      ////console.log("_____")
      if (rows.length) {
        res.status(200).send({ "status": false, "message": "Already_Exist" })
      } else {
        connection.query('INSERT INTO `fetured_product_table`(`product_id`, `fetured_type`, `start_date`, `end_date`) VALUES ("' + product_id + '","' + fetured_type + '","' + start_date + '","' + end_date + '")', (err, rows, fields) => {
          if (err) {
            //console.log("/fetured_product" + err)
            res.status(200).send(err)
          } else {
            rows != '' ? res.status(200).send({ "status": true, "results": rows }) : res.status(200).send({ "status": false, "message": "error" })
          }
        })
        // res.status(200).send({"message":"not_match :-  product_id -- fetured_type -- is_deleted "})
      }

    }
  })
}

