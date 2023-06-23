import connection from "../../Db.js";

export function trending_products(req, res) {
  console.log(req.body)
  let { from_date, to_date } = req.body
  let query_ = "SELECT COUNT(`order`.product_id) AS sale_count, `order`.product_id, `order`.created_on,`product_view`.`id`,`product_view`.`vendor_id`,`product_view`.`name`,`product_view`.`seo_tag`,`product_view`.`brand`,`product_view`.`category`,`product_view`.`is_deleted`,`product_view`.`status`,`product_view`.`review`,`product_view`.`rating`,`product_view`.`description`,`product_view`.`care_and_instructions`,`product_view`.`benefits`,`product_view`.`is_active`,`product_view`.`created_by`,`product_view`.`created_by_id`,`product_view`.`created_on`,`product_view`.`updated_on`,`product_view`.`product_verient_id`,`product_view`.`product_id`,`product_view`.`verient_name`,`product_view`.`quantity`,`product_view`.`unit`,`product_view`.`product_stock_quantity`,`product_view`.`price`,`product_view`.`mrp`,`product_view`.`gst`,`product_view`.`sgst`,`product_view`.`cgst`,`product_view`.`verient_is_deleted`,`product_view`.`verient_status`,`product_view`.`discount`,`product_view`.`verient_description`,`product_view`.`verient_is_active`,`product_view`.`verient_created_on`,`product_view`.`verient_updated_on`,`product_view`.`product_height`,`product_view`.`product_width`,`product_view`.`product_Weight`,`product_view`.`cover_image`,`product_view`.`all_images_url`,`product_view`.`avgRatings` FROM `order` LEFT JOIN `product_view` ON `order`.product_id = `product_view`.product_id WHERE "


  if (from_date && to_date) {
    query_ += "`order`.created_on BETWEEN '" + from_date + " 12:00:00' AND '" + to_date + " 23:59:00'"
  } else {
    var today = new Date();
    var sevenDaysAgo = new Date(today);
    to_date = today.toISOString().slice(0, 19).replace("T", " ");
    sevenDaysAgo.setDate(today.getDate() - 7);
    from_date = sevenDaysAgo.toISOString().slice(0, 19).replace("T", " ");
    query_ += "`order`.created_on BETWEEN '" + from_date + "' AND '" + to_date + "'"
  }
  for (let k in req.body) {
    if (k != "from_date" && k != "to_date") {
      query_ += ` AND product_view.${k} = '${req.body[k]}'`
    } else {

    }
  }

  console.log(query_ + " GROUP BY `order`.product_id ORDER BY sale_count DESC")
  connection.query(query_ + " GROUP BY `order`.product_id ORDER BY sale_count DESC", (err, rows) => {
    if (err) {
      console.log(err)
      res.status(200)
        .json({ status: false, message: "something went wrong" });
    } else {
      res.status(200).json({ status: true, results: rows });
    }
  });
}
