import connection from "../../Db.js";
import FCM from "fcm-node";
export const serverKey =
  "AAAAWM6767Q:APA91bFq0e3LuukAOH4vsnPrQoEx-j45muw4pP0w0eEXuMv669RVyowpV4Y7FLwcnCjiO4s8UHk-BbOpukEVkHSeNf3aEDpYaerQl74gage2KHzoxDIhuNPdByXXynTjHUNYPsHfiAM5";
const fcm = new FCM(serverKey);

export const sendNotification = (notfData) => {
  let message = {
    to: notfData["userDeviceToken"],
    notification: {
      title: notfData["notfTitle"],
      body: notfData["notfMsg"],
    },
    data: notfData["customData"],
  };

  fcm.send(message, (err, response) => {
    if (err) {
      console.log(`Something has gone wrong! ${err}`);
      console.log(`Response: ${response}`);
    } else {
      console.log("Successfully sent with response: ", response);
    }
  });
};

export const setNotification = (notfDataForDB) => {
  // let notfDataForDB = notfData["setNotfOnDB"];
  connection.query(
    'INSERT INTO `notification`(`actor_id`, `actor_type`, `message`, `status`,`notification_title`,`notification_type`,`notification_type_id`) VALUES ("' +
    notfDataForDB["actor_id"] +
    '","' +
    notfDataForDB["actor_type"] +
    '","' +
    notfDataForDB["message"] +
    '","' +
    notfDataForDB["status"] +
    '","' +
    notfDataForDB["notification_title"] +
    '","' +
    notfDataForDB["notification_type"] +
    '","' +
    notfDataForDB["notification_type_id"] +
    '")',
    (err, rows) => {
      if (err) {
        console.log({ notification: err });
      } else {
        console.log(rows);
      }
    }
  );
};

// var notfData = {
//   userDeviceToken:"",
//   notfTitle: "tst hello notf",
//   notfMsg: "hello msg",
//   customData: { teest: "123123123" },
// };
// sendNotification(notfData);

// let notfDataForDB = {
//   actor_id: "",
//   actor_type: "",
//   message: "",
//   status: "",
//   notification_title: "",
//   notification_type: "",
//   notification_type_id: "",
// };
// setNotification(notfDataForDB);
