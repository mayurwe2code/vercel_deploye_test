import mysql from "mysql";
import "dotenv/config";

// node
// console.log();
// const connection = mysql.createConnection({
//   host: "b8ge1gim6edaq5jr1rht-mysql.services.clever-cloud.com",
//   user: "u9fe8rqvh3wh0bpk",
//   password: "pbzyUJkHu07N0RCQAG1t",
//   database: "b8ge1gim6edaq5jr1rht",
// });

// connection.connect((error) => {
//   if (error) throw error;
//   console.log("Successfully connected to the database.");
// });
// export default connection;


// export default function handleDisconnect() {
var connection = mysql.createConnection({
  host: "b8ge1gim6edaq5jr1rht-mysql.services.clever-cloud.com",
  user: "u9fe8rqvh3wh0bpk",
  password: "pbzyUJkHu07N0RCQAG1t",
  database: "b8ge1gim6edaq5jr1rht",
});

connection.connect(function (err) {
  if (err) {
    console.log('error when connecting to db:', err);
    setTimeout(connection, 2000);
  }
});
connection.on('error', function (err) {
  console.log('db error', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    // handleDisconnect();
    connection
  } else {
    throw err;
  }
});
// }
export default connection;

