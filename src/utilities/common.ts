import { NextFunction, Request, Response } from "express";
import { createRequest } from "../config";
import * as crypto from 'crypto';
import sql from "mssql";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import {
    Log_Api,
    Log_Payment
} from "../dbcless";


// const activityLogPayment = async (
//     log_type: string,
//     id: string,
//     type: string,
//     method: string,
//     channel_payment: string,
//     payment_method: string,
//     order_id: string,
//     origin: string,
//     header: string,
//     body: string,
//     req: Request,
//   ) => {
//     try {
//         let log_id: string;
//         if (log_type === "insert") {
//             log_id = uuidv4();
  
//             await Log_Payment.insert(createRequest(), {
//                 id: log_id,
//                 type: type,
//                 method: method,
//                 channel_payment: channel_payment,
//                 payment_method: payment_method,
//                 order_id: order_id,
//                 origin: origin,
//                 header: header,
//                 body: body,
//                 status: "pending",
//             });
//         } else {
//             log_id = id;

//         }
//       return log_id;
//     } catch (errer) {
//       errer.status = 400;
//       throw new Error(errer.message);
//     }
// };
const generateOrderNumber = async () => {
    const order_runnumber = await createRequest()
    .input("RunKey", sql.NVarChar, "ORDER")
    .input("KeyCode", sql.NVarChar, "order")
    .input("CreateDate", sql.Date, new Date())
    .execute("sp_CreateRunning");

    return String(order_runnumber.recordset[0]["RunKey"]);
}

const generateSHA256Hash = async (data: string) => {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
}

export {
    generateSHA256Hash,
    generateOrderNumber
}