import { NextFunction, Request, Response } from "express";
import { createRequest } from "../../../config";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Log_Payment, Transaction_Payment } from "../../../dbcless";

export const createOrder = async (data_body: any) => {
    const outbound_id = uuidv4();
    try {

        let request_body =
        {
            amount: data_body.amount,
            currency: "THB",
            description: data_body.description,
            source_type: "qr",
            reference_order: data_body.reference_order,
            ref_1: data_body.ref_1,
            ref_2: data_body.ref_2,
            ref_3: data_body.ref_3
        }

        //insert log payment
        await Log_Payment.insert(createRequest(), {
            id: outbound_id,
            type: "outbound",
            method: "POST",
            channel_payment: process.env.KBANK_CHANNEL_NAME,
            payment_method: "create_order",
            order_id: data_body.reference_order,
            origin: `${process.env.KBANK_API_URL}/qr/v2/order`,
            header: JSON.stringify(data_body.request_header),
            body: JSON.stringify(request_body),
            status: "pending",
        });

        const bankdata = await axios({
            url: `${process.env.KBANK_API_URL}/qr/v2/order`,
            method: "POST",
            data: request_body,
            headers: data_body.request_header,
        });

        //update log payment success
        await Log_Payment.update(
            createRequest(),
            {
                response: JSON.stringify(bankdata.data),
                status: "success",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "create_order",
            }
        );

        return {
            status: 200,
            message: "success",
            data: bankdata.data || {},
        };
    } catch (error) {
        await Log_Payment.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                status: "fail",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "create_order",
            }
        );
        return {
            status: error?.status || error?.response?.status || 500,
            message: error?.response?.data?.error || error?.message || error,
            data: error?.data || error?.response?.data || {},
        };
    }
}

export const qrPaymentGenerateQr = async (data_body: any) => {
    const outbound_id = uuidv4();
    try {
        let request_body =
        {
            order_id: data_body.id,
            amount: data_body.amount,
            currency: "THB",
            description: data_body.description,
            sof: "ThaiQR",
            reference_order: data_body.reference_order,
            metadata: [] as any,
        }

        //insert log payment
        await Log_Payment.insert(createRequest(), {
            id: outbound_id,
            type: "outbound",
            method: "POST",
            channel_payment: process.env.KBANK_CHANNEL_NAME,
            payment_method: "create_qr",
            order_id: data_body.reference_order,
            origin: `${process.env.KBANK_API_URL}/qr/v2/qr`,
            header: JSON.stringify(data_body.request_header),
            body: JSON.stringify(request_body),
            status: "pending",
        });

        const bankdataqr = await axios({
            url: `${process.env.KBANK_API_URL}/qr/v2/qr`,
            method: "POST",
            data: request_body,
            headers: data_body.request_header,
        });

        //update log payment success
        await Log_Payment.update(
            createRequest(),
            {
                response: JSON.stringify(bankdataqr.data),
                status: "success",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "create_qr",
            }
        );

        return {
            status: 200,
            message: "success",
            data: bankdataqr.data || {},
        };
    } catch (error) {
        await Log_Payment.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                status: "fail",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "create_qr",
            }
        );
        return {
            status: error?.status || error?.response?.status || 500,
            message: error?.response?.data?.error || error?.message || error,
            data: error?.data || error?.response?.data || {},
        };
    }
}

export const createCharge = async (data_body: any) => {
    const outbound_id = uuidv4();
    try {
        let request_body =
        {
            amount: parseFloat(data_body.amount.toString()) * 1.0,
            currency: data_body.dcc_currency ? (data_body.dcc_currency !== "" ? data_body.dcc_currency : "THB") : "THB",
            description: data_body.description,
            source_type: "card",
            mode: "token",
            reference_order: data_body.reference_order,
            token: data_body.token,
            ref_1: data_body.ref_1,
            ref_2: data_body.ref_2,
            ref_3: data_body.ref_3,
            dcc_data: {
                dcc_currency: data_body.dcc_currency ? (data_body.dcc_currency !== "" ? data_body.dcc_currency : "THB") : "THB",
            },
            additional_data: {
                mid: data_body.merchant_id,
                tid: data_body.terminal_id,
            },
        }

        //insert log payment
        await Log_Payment.insert(createRequest(), {
            id: outbound_id,
            type: "outbound",
            method: "POST",
            channel_payment: process.env.KBANK_CHANNEL_NAME,
            payment_method: "create_charge",
            order_id: data_body.reference_order,
            origin: `${process.env.KBANK_API_URL}o`,
            header: JSON.stringify(data_body.request_header),
            body: JSON.stringify(request_body),
            status: "pending",
        });

        const bankdata = await axios({
            url: `${process.env.KBANK_API_URL}/card/v2/charge`,
            method: "POST",
            data: request_body,
            headers: data_body.request_header,
        });

        //update log payment success
        await Log_Payment.update(
            createRequest(),
            {
                response: JSON.stringify(bankdata.data),
                status: "success",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "create_charge",
            }
        );

        return {
            status: 200,
            message: "success",
            data: bankdata.data || {},
        };
    } catch (error) {
        await Log_Payment.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                status: "fail",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "create_charge",
            }
        );
        return {
            status: error?.status || error?.response?.status || 500,
            message: error?.response?.data?.error || error?.message || error,
            data: error?.data || error?.response?.data || {},
        };
    }
}

export const cancelQr = async (qr_id: string) => {
    const outbound_id = uuidv4();
    try {
        const payment = await Transaction_Payment.findOne(createRequest(), {
            qr_code: qr_id,
        });

        if (!payment) {
            return {
                status: 400,
                message: "ไม่พบรายการ",
            };
        }

        await Log_Payment.insert(createRequest(), {
            id: outbound_id,
            type: "outbound",
            method: "POST",
            channel_payment: process.env.KBANK_CHANNEL_NAME,
            payment_method: "cancel_qr",
            order_id: payment.order_id,
            origin: `${process.env.KBANK_API_URL}/qr/${qr_id}/cancel`,
            status: "pending",
        });

        const cancel_qr = await axios({
            url: `${process.env.KBANK_API_URL}/qr/${qr_id}/cancel`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": payment?.secret_key,
            },
        });

        await Log_Payment.update(
            createRequest(),
            {
                response: JSON.stringify(cancel_qr.data),
                status: "success",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "cancel_qr",
            }
        );

        return {
            status: 200,
            message: "success",
            data: cancel_qr.data || {},
        };
    } catch (error) {
        await Log_Payment.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                status: "fail",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "cancel_qr",
            }
        );
        return {
            status: error?.status || error?.response?.status || 500,
            message: error?.response?.data?.error || error?.message || error,
            data: error?.data || error?.response?.data || {},
        };
    }
}

export const qrInquiry = async (charge_id: string) => {
    const outbound_id = uuidv4();
    try {
        const payment = await Transaction_Payment.findOne(createRequest(), {
            txn_id: charge_id,
        });

        if (!payment) {
            return {
                status: 400,
                message: "ไม่พบรายการ",
            };
        }

        await Log_Payment.insert(createRequest(), {
            id: outbound_id,
            type: "outbound",
            method: "GET",
            channel_payment: process.env.KBANK_CHANNEL_NAME,
            payment_method: "qr_inquiry",
            order_id: payment.order_id,
            origin: `${process.env.KBANK_API_URL}/qr/v2/qr/${charge_id}`,
            status: "pending",
        });

        const inquiry = await axios({
            url: `${process.env.KBANK_API_URL}/qr/v2/qr/${charge_id}`,
            method: "GET",
            headers: {
                "x-api-key": payment?.secret_key,
            },
        });

        await Log_Payment.update(
            createRequest(),
            {
                response: JSON.stringify(inquiry.data),
                status: "success",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "qr_inquiry",
            }
        );

        return {
            status: 200,
            message: "success",
            data: inquiry.data || {},
        };
    } catch (error) {
        await Log_Payment.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                status: "fail",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "qr_inquiry",
            }
        );

        return {
            status: error?.status || error?.response?.status || 500,
            message: error?.response?.data?.error || error?.message || error,
            data: error?.data || error?.response?.data || {},
        };
    }
}

export const cardInquiry = async (charge_id: string) => {
    const outbound_id = uuidv4();
    try {
        const payment = await Transaction_Payment.findOne(createRequest(), {
            txn_id: charge_id,
        });

        if (!payment) {
            return {
                status: 400,
                message: "ไม่พบรายการ",
            };
        }

        await Log_Payment.insert(createRequest(), {
            id: outbound_id,
            type: "outbound",
            method: "POST",
            channel_payment: process.env.KBANK_CHANNEL_NAME,
            payment_method: "card_inquiry",
            order_id: payment.order_id,
            origin: `${process.env.KBANK_API_URL}/card/v2/charge/${charge_id}`,
            status: "pending",
        });

        const inquiry = await axios({
            url: `${process.env.KBANK_API_URL}/card/v2/charge/${charge_id}`,
            method: "GET",
            headers: {
                "x-api-key": payment?.secret_key,
            },
        });

        await Log_Payment.update(
            createRequest(),
            {
                response: JSON.stringify(inquiry.data),
                status: "success",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "card_inquiry",
            }
        );

        return {
            status: 200,
            message: "success",
            data: inquiry.data || {},
        };
    } catch (error) {
        await Log_Payment.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                status: "fail",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "card_inquiry",
            }
        );

        return {
            status: error?.status || error?.response?.status || 500,
            message: error?.response?.data?.error || error?.message || error,
            data: error?.data || error?.response?.data || {},
        };
    }
}

export const getOrder = async (id: string) => {
    const outbound_id = uuidv4();
    try {
        const payment = await Transaction_Payment.findOne(createRequest(), {
            reference_id: id,
        });

        if (!payment) {
            return {
                status: 400,
                message: "ไม่พบรายการ",
            };
        }

        await Log_Payment.insert(createRequest(), {
            id: outbound_id,
            type: "outbound",
            method: "GET",
            channel_payment: process.env.KBANK_CHANNEL_NAME,
            payment_method: "get_order",
            order_id: payment.order_id,
            origin: `${process.env.KBANK_API_URL}/qr/v2/order/${id}`,
            status: "pending",
        });

        const order = await axios({
            url: `${process.env.KBANK_API_URL}/qr/v2/order/${id}`,
            method: "GET",
            headers: {
                "x-api-key": payment?.secret_key,
            },
        });

        await Log_Payment.update(
            createRequest(),
            {
                response: JSON.stringify(order.data),
                status: "success",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "get_order",
            }
        );
        
        order.data.order_id = payment?.order_id;
        return {
            status: 200,
            message: "success",
            data: order.data || {},
        };
    } catch (error) {
        await Log_Payment.update(
            createRequest(),
            {
                error_message: JSON.stringify(error),
                status: "fail",
                update_date: new Date(),
            },
            {
                id: outbound_id,
                payment_method: "get_order",
            }
        );

        return {
            status: error?.status || error?.response?.status || 500,
            message: error?.response?.data?.error || error?.message || error,
            data: error?.data || error?.response?.data || {},
        };
    }
}

