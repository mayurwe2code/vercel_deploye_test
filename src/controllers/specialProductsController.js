import connection from "../../Db.js";

export function trending_products(req, res) {
  console.log(req.body)

  //SELECT count(product_id) as sale_count ,product_id,created_on FROM `order` WHERE created_on BETWEEN '2023-06-03 12:00:00' AND '2023-06-21 23:59:00' GROUP BY product_id ORDER BY sale_count DESC
  //SELECT count(product_id) as sale_count ,product_id,created_on FROM `order`,`product_view` WHERE order.created_on BETWEEN '2023-06-03 12:00:00' AND '2023-06-21 23:59:00' GROUP BY product_id ORDER BY sale_count DESC
  connection.query("", (err, rows) => {
    if (err) {
      console.log("err---------------------63-----")
      console.log(err)
      res
        .status(200)
        .json({ message: "something went wrong" });
    } else {
      res.status(StatusCodes.OK).json(rows);
    }
  });
}