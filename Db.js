import mysql from "mysql";
import "dotenv/config";

// node
console.log();
const connection = mysql.createConnection({
  host: "b8ge1gim6edaq5jr1rht-mysql.services.clever-cloud.com",
  user: "u9fe8rqvh3wh0bpk",
  password: "pbzyUJkHu07N0RCQAG1t",
  database: "b8ge1gim6edaq5jr1rht",
});

connection.connect((error) => {
  if (error) throw error;
  console.log("Successfully connected to the database.");
});
export default connection;
