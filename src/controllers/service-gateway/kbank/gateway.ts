import { NextFunction, Request, Response } from "express";
import { createRequest } from "../../../config";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import {
    Log_Api,
    Log_Payment,
    Master_Product,
    Transaction_Payment
} from "../../../dbcless";
import sql from "mssql";
import * as yup from "yup";
import * as kbank from "./gateway-kbank";
import { generateOrderNumber, generateSHA256Hash } from '../../../utilities/common';
import _ from "lodash";
import { snakeCaseKeys } from "../../../dbcless/SqlUtility";

const schema = yup.object({
    callback_url: yup.string().required(),
    payment_type: yup.string().required(),
    amount: yup.number().required(),
    merchant_id: yup.string().required(),
    secret_key: yup.string().required(),
});

//รายการชำระเงินสำหรับ
export const createPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const inbound_id = uuidv4();
    try {
        //insert log api
        await Log_Api.insert(createRequest(), {
            id: inbound_id,
            type: "inbound",
            method: "POST",
            origin: `${process.env.URL}/kbank/payment/create`,
            header: JSON.stringify(req.headers),
            body: JSON.stringify(req.body),
        });

        const {
            callback_url,
            payment_type, //qr, card
            amount,
            dcc_currency,
            description,
            merchant_id,
            secret_key,
            terminal_id,
            token,   //สำหรับ create charge
            developer_code,
            customer_id,
            term_id,
            term_name,
            ref_1,
            ref_2,
            ref_3,
            redirect_url_success,
            redirect_url_fail,
        } = req.body;

        await schema.validate({
            callback_url,
            payment_type,
            amount,
            merchant_id,
            secret_key,
            developer_code,
            customer_id,
        }, {
            abortEarly: false,
            stripUnknown: false,
            strict: true,
        }).catch((error: any) => {
            throw { status: 400, message: error.errors[0] || error.message, data: {} };
        });

        let payment: any = {};
        let qr_payment: any = {};
        let card_payment: any = {};
        let order_id: string;
        let res_data: any = {};
        let txn_id: string;
        let reference_id: string;
        let payment_method: string;

        order_id = await generateOrderNumber();
        req.body.reference_order = order_id;
        let request_header =
        {
            "Content-Type": "application/json",
            "x-api-key": req.body.secret_key,
        }
        if (payment_type === "QR") {
            payment_method = "QR Promptpay";
            payment = await kbank.createOrder({ ...req.body, "request_header": request_header });
            if (payment && payment.status == 200) {
                reference_id = payment?.data?.id // order id from Kbank
                qr_payment = await kbank.qrPaymentGenerateQr({ ...payment.data, "request_header": request_header });
                if (qr_payment && qr_payment.status == 200) {
                    res_data = {
                        "order_id": order_id,
                        ...payment.data,
                        qr: _.omit(qr_payment.data, [
                            "order_id",
                        ])
                    };
                } else {
                    throw qr_payment;
                }
            } else {
                throw payment;
            }
        }

        if (payment_type === "CARD") {
            payment_method = "Credit Card";
            payment = await kbank.createCharge({ ...req.body, "request_header": request_header });
            if (payment && payment.status == 200) {
                txn_id = payment?.data?.id; //txn_id is charge id
                reference_id = req.body.token; //token id
                card_payment = {
                    ...payment.data.source
                }
                res_data = {
                    "order_id": order_id,
                    ...payment.data,
                }
            } else {
                throw payment;
            }
        }

        //บันทึกข้อมูลการจ่ายเงิน
        //insert data ตาราง transection_payment status: PENDING
        await Transaction_Payment.insert(createRequest(), {
            order_id: order_id,  // id order ที่ payment gen
            txn_id: txn_id, //  charge id
            reference_id: reference_id,  //order id kbank or token id for card 
            channel_payment: process.env.KBANK_CHANNEL_NAME,
            product_payment: req?.product_name,
            client_id: req.client_id,
            callback_url: callback_url,
            redirect_url: JSON.stringify({
                redirect_url_success: redirect_url_success || "",
                redirect_url_fail: redirect_url_fail || ""
            }),
            payment_method: payment_method,
            customer_id: customer_id,
            amount: amount,
            amount_net: 0.00,
            amount_cust_fee: 0.00,
            currency: dcc_currency ? (dcc_currency !== "" ? dcc_currency : "THB") : "THB",
            merchant_id: merchant_id,
            secret_key: secret_key,
            term_id: term_id,
            term_name: term_name,
            card_ref: card_payment?.id, // card id
            card_no: card_payment?.card_masking,
            card_type: card_payment?.brand,
            card_bank: card_payment?.issuer_bank,
            qr_code: qr_payment?.data?.id, // qr id
            qr_expire_time_seconds: qr_payment?.data?.expire_time_seconds,
            developer_code: developer_code,
            ref_1: ref_1,
            ref_2: ref_2,
            ref_3: ref_3,
            description: description,
            payment_status: "PENDING",
        });
        //update log api successs
        await Log_Api.update(
            createRequest(),
            {
                response: JSON.stringify(res_data),
                update_date: new Date()
            },
            {
                id: inbound_id,
            }
        );

        res.status(200)
            .send({
                status: 200, message: "success", data: _.omit(res_data, [
                    "reference_order",
                ])
            });
    } catch (error) {
        //update log api error
        await Log_Api.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                update_date: new Date()
            },
            {
                id: inbound_id,
            }
        );
        res.status(error.status || 500).send({
            status: error.status || 500,
            message: error?.message || "fail",
            data: error?.data || error || {},
        });
    }
};

export const callback = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const inbound_id = uuidv4();
    try {
        if (!req.body.objectId || req.body.objectId === "") {
            console.log(false)
            return res.status(200).send({ status: 200, message: "success" });
        }
        //insert log payment
        await Log_Payment.insert(createRequest(), {
            id: inbound_id,
            type: "inbound",
            method: "POST",
            channel_payment: process.env.KBANK_CHANNEL_NAME,
            payment_method: "callback",
            order_id: `charge_id: ${req.body.objectId}`,
            origin: `${process.env.URL}/kbank/callback`,
            body: JSON.stringify(req.body),
            status: "success",
        });

        //find payment จาก order_id
        const payment = await Transaction_Payment.findOne(createRequest(), {
            txn_id: req.body.objectId,
        });
        let redirect_url: string;
        if (payment) {
            req.body.order_id = payment.order_id;
            await Log_Payment.update(createRequest(), {
                order_id: payment.order_id,
            }, {
                id: inbound_id,
            });

            if (req.body.status === "true") {
                redirect_url = JSON.parse(payment?.redirect_url)?.redirect_url_success;
            } else {
                redirect_url = JSON.parse(payment?.redirect_url)?.redirect_url_fail;
            }
            callbackToProduct(payment?.callback_url, { ...req.body, callback_type: "callback" });
        }

        if (redirect_url && redirect_url !=="") {
            console.log(`${process.env.URL}/redirect?action=` + encodeURIComponent(redirect_url));
            return res.redirect(`${process.env.URL}/redirect?action=` + encodeURIComponent(redirect_url));
        }

        res.status(200).send({ status: 200, message: "success" });
    } catch (error) {
        res.status(500).send({ status: 500, message: error?.message || error });
    }
};

export const notify = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const inbound_id = uuidv4();
    try {
        if (!req.body.reference_order || req.body.reference_order === "") {
            console.log(false)
            return res.status(200).send({ status: 200, message: "success" });
        }

        let callback_type = req.body.object === "qr" ? "notify_qr" : req.body.object === "charge" ? "notify_card" : req.body.object;
        //insert log payment
        await Log_Payment.insert(createRequest(), {
            id: inbound_id,
            type: "inbound",
            method: "POST",
            channel_payment: process.env.KBANK_CHANNEL_NAME,
            payment_method: callback_type,
            order_id: req.body.reference_order,
            origin: `${process.env.URL}/kbank/notify/${req.body.object === "qr" ? "qr" : req.body.object === "charge" ? "card" : req.body.object}`,
            body: JSON.stringify(req.body),
            status: "success",
        });

        //find payment จาก order_id
        const payment = await Transaction_Payment.findOne(createRequest(), {
            order_id: req.body.reference_order,
        });

        if (payment) {
            //ตรวจสอบความถูกต้องของข้อมูล
            //id(Charge ID) + amount(convert to string format to 4 decimal places) + currency +status + transaction_state + salt (salt is merchant secret key)
            let sum_string = `${req.body.id}${req.body.amount.toFixed(4).toString()}${req.body.currency}${req.body.status}${req.body.transaction_state}${payment.secret_key}`
            let checksum = await generateSHA256Hash(sum_string);
            //console.log("sum_string: ", sum_string, "----------", "checksum: ", checksum)
            if (checksum === req.body.checksum) {
                console.log("checksum: true")
                req.body.order_id = req.body.reference_order;
                //update data ตาราง transection_payment status: SUCCESS
                await Transaction_Payment.update(
                    createRequest(),
                    {
                        txn_id: req.body.id,  //charge id
                        payment_status: req.body.status ? ((req.body.status === "success" && req.body.transaction_state === "Authorized") ? "SUCCESS" : "FAIL") : req.body?.status,
                        update_date: new Date(),
                    },
                    {
                        //reference_id: req.body.token
                        order_id: req.body.reference_order,
                    }
                );
                req.body.callback_type = callback_type;
                callbackToProduct(payment?.callback_url, _.omit(req.body, [
                    "reference_order",
                ]));
            } else {
                console.log("checksum: false")
                await Log_Payment.update(createRequest(), {
                    status: "fail",
                    error_message: JSON.stringify({ "checksum": checksum, "message": "Checksum mismatch." })
                }, {
                    id: inbound_id,
                });
            }
        }

        res.status(200).send({ status: 200, message: "success" });
    } catch (error) {
        res.status(500).send({ status: 500, message: error?.message || error });
    }
};

async function callbackToProduct(callback_url: string, data: any) {
    //console.log("callback to product:", data);
    if (callback_url) {
        //callback to product
        axios({
            method: "POST",
            url: callback_url,
            data: snakeCaseKeys(data),
        })
            .then((data) => {
                console.log("product success");
            })
            .catch((err) => {
                console.log("product error");
            });
    }

    return true
}

export const cancelQr = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const inbound_id = uuidv4();
    try {
        await Log_Api.insert(createRequest(), {
            id: inbound_id,
            type: "inbound",
            method: "GET",
            origin: `${process.env.URL}/payment/qr/${req.params.qr_id}/cancel`,
            header: JSON.stringify(req.headers),
        });
        const cancel_qr = await kbank.cancelQr(req.params.qr_id);

        if (cancel_qr.status != 200) {
            throw cancel_qr;
        }

        res.status(200).send({
            status: 200,
            message: "success",
            data: cancel_qr.data || {},
        });
    } catch (error) {
        await Log_Api.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                update_date: new Date()
            },
            {
                id: inbound_id,
            }
        );
        res.status(error.status || 500).send({
            status: error.status || 500,
            message: error?.message || error || "fail",
        });
    }
}

export const getQrInquiry = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const inbound_id = uuidv4();
    try {
        await Log_Api.insert(createRequest(), {
            id: inbound_id,
            type: "inbound",
            method: "GET",
            origin: `${process.env.URL}/kbank/payment/qr/inquiry/${req.params.charge_id}`,
            header: JSON.stringify(req.headers),
        });

        const qr_inquiry = await kbank.qrInquiry(req.params.charge_id);

        if (qr_inquiry.status != 200) {
            throw qr_inquiry;
        }

        res.status(200).send({
            status: 200,
            message: "success",
            data: qr_inquiry.data || {},
        });
    } catch (error) {
        await Log_Api.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                update_date: new Date()
            },
            {
                id: inbound_id,
            }
        );
        res.status(error.status || 500).send({
            status: error.status || 500,
            message: error?.message || error || "fail",
        });
    }
}

export const getCardInquiry = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const inbound_id = uuidv4();
    try {
        await Log_Api.insert(createRequest(), {
            id: inbound_id,
            type: "inbound",
            method: "POST",
            origin: `${process.env.URL}/kbank/payment/card/inquiry/${req.params.charge_id}`,
            header: JSON.stringify(req.headers),
        });
        const card_inquiry = await kbank.cardInquiry(req.params.charge_id);

        if (card_inquiry.status != 200) {
            throw card_inquiry;
        }

        res.status(200).send({
            status: 200,
            message: "success",
            data: card_inquiry.data || {},
        });
    } catch (error) {
        await Log_Api.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                update_date: new Date()
            },
            {
                id: inbound_id,
            }
        );
        res.status(error.status || 500).send({
            status: error.status || 500,
            message: error?.message || error || "fail",
        });
    }
}

export const getOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const inbound_id = uuidv4();
    try {
        await Log_Api.insert(createRequest(), {
            id: inbound_id,
            type: "inbound",
            method: "GET",
            origin: `${process.env.URL}/kbank/payment/qr/order/${req.params.id}`,
            header: JSON.stringify(req.headers),
        });
        const orderdata = await kbank.getOrder(req.params.id);

        if (orderdata.status != 200) {
            throw orderdata;
        }

        res.status(200).send({
            status: 200,
            message: "success",
            data: _.omit(orderdata.data, [
                "reference_order",
            ]) || {},
        });
    } catch (error) {
        await Log_Api.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                update_date: new Date()
            },
            {
                id: inbound_id,
            }
        );
        res.status(error.status || 500).send({
            status: error.status || 500,
            message: error?.message || error || "fail"
        });
    }
}
