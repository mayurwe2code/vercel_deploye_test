import connection from "../../Db.js";


export function review_rating(req, res) {
    //console.log("review")
    //console.log("req.body")

    console.log(req.user_id)
    var { product_id, product_name, user_name, review_rating, comment, review_date } = req.body;
    connection.query('SELECT * FROM `review` WHERE user_id="' + req.user_id + '" AND product_id="' + product_id + '"', (err, rows, fields) => {
        if (err) {
            //console.log("/review_error"+err)
            res.status(200).send(err)
        } else {
            if (rows == "") {
                connection.query('INSERT INTO  `review`( `user_id`, `user_name`, `product_id`,`product_name`,`review_date`,`review_rating`, `comment`) VALUES ("' + req.user_id + '","' + user_name + '","' + product_id + '","' + product_name + '","' + review_date + '","' + review_rating + '","' + comment + '")', (err, rows, fields) => {
                    if (err) {
                        res.status(200).send(err)
                    } else {
                        //console.log("review_rating Data Insert Succecsfully")
                        res.status(201).send({ status: true, message: "Review Rating Data Insert Succecsfully" })
                    }
                })
            } else {
                res.status(200).send({ "message": "User already Reviewed", "status": false })
            }

        }
    })

}


export function review_approved(req, res) {

    if (req.headers.admin_token) {
        var { id, status } = req.body;
        connection.query('UPDATE `review` SET `status`="' + status + '" WHERE `id`="' + id + '" ', (err, rows, fields) => {
            if (err) {
                res.status(200).send(err)
            } else {
                //console.log("review_approved update Succecsfully")
                res.status(200).send({ status: true, message: "Review " + status + " Update Succecsfully" })
            }
        })
    } else {
        res.status(200).send({ status: false, "response": "please send admin token" })
    }
}

export async function review_list(req, res) {
    let req_body = req.body
    let len_obj = Object.keys(req_body).length
async function query_maker (){
    let query_ ="SELECT review.*,user.image FROM `review`,`user` WHERE review.user_id = user.id AND  "
let i = 1;
for(let k in req_body){
    if(k != "product_name" && req_body[k] != ""){
        query_+=`${k} = '${req_body[k]}' AND  `
    }
    if(k === "product_name" && req_body[k] != "" ){
        query_+=`(product_name LIKE '%${req_body[k]}%' OR user_name LIKE '%${req_body[k]}%') AND  ` 
    }
    if(len_obj === i){
        query_ =  query_.substring(0,query_.length-5)
    }
    i++
}
return query_
}
let query = await query_maker()
console.log(query+" ORDER BY created_on DESC--------------")
connection.query(query+" ORDER BY created_on DESC", (err, rows, fields) => {
    if (err) {
        console.log(err)
        res.status(200).send(err)
    } else {
        res.status(200).send(rows)
    }
})
}