import { NextFunction, Request, Response } from "express";
import { createRequest } from "../../../config";
import crypto from "crypto";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Log_Payment, Transaction_Payment } from "../../../dbcless";
import { snakeCaseKeys } from "../../../utilities";

//************ Credit Cart ************/
//[Credit Cart] สร้าง Order รายการชำระเงิน (payment_method: "credit_cart_payment_order")
export const creditCartPaymentOrder = async (data_body: any) => {
  const outbound_id = uuidv4();
  try {
    let service_id: string = data_body?.service_id;
    let secret_key: string = data_body?.secret_key;
    let payment_method: string;
    switch (data_body.credit_card_type) {
      case "VISA":
        //service_id = process.env.MPAY_SERVICE_CC_MB_QRPP;
        payment_method = "Credit Card (Full Payment)-VS";
        break;
      case "JCB":
        //service_id = process.env.MPAY_SERVICE_CC_MB_QRPP;
        payment_method = "Credit Card (Full Payment)-JCB";
        break;
      case "MASTERCARD":
        //service_id = process.env.MPAY_SERVICE_CC_MB_QRPP;
        payment_method = "Credit Card (Full Payment)-MC";
        break;
      case "UNIONPAY":
        //service_id = process.env.MPAY_SERVICE_CREDIT_CARD_UP;
        payment_method = "Credit Card (Full Payment)-Union Pay";
        break;
      case "AMEX":
        //service_id = process.env.MPAY_SERVICE_CREDIT_CARD_AM;
        payment_method = "Credit Card (Full Payment)-AMEX";
        break;
    }
    let request_body = {
      order_id: data_body.order_id,
      product_name: data_body.product_payment,
      service_id: service_id,
      channel_type: "APPLICATION",
      cust_id: data_body.customer_id,
      amount: data_body.amount,
      currency: "THB",
      ref_1: data_body?.ref_1 || "",
      ref_2: data_body?.ref_2 || "",
      ref_3: data_body?.ref_3 || "",
      ref_4: data_body?.ref_4 || "",
      ref_5:data_body?.ref_5 || "",
      capture: true,
      form_type: "FORM",
      skin_code: "mpay",
      is_remember: "false",
      // metadata: {
      //   key1: "value1",
      //   key2: "value2",
      // },
      "3ds": {
        "3ds_required": true,
        "3ds_url_success": data_body.redirect_url_success,
        "3ds_url_fail": data_body.redirect_url_fail,
      },
    };

    const signature = await encryptSignature(request_body, secret_key);
    if (signature.status != 200) {
      return { status: signature.status, message: signature.message };
    }

    let request_header = {
      "Content-Type": "application/json; charset=UTF-8",
      "X-sdpg-nonce": signature.data.nonce,
      "X-sdpg-merchant-id": data_body?.merchant_id, //ดึงตาม dev ที่ product
      "X-sdpg-signature": signature.data.signature,
    };

    //insert log payment
    await Log_Payment.insert(createRequest(), {
      id: outbound_id,
      type: "outbound",
      method: "POST",
      channel_payment: process.env.MPAY_CHANNEL_NAME,
      payment_method: "credit_cart_payment_order",
      order_id: data_body.order_id,
      origin: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/cc/txns/payment_order`,
      header: JSON.stringify(request_header),
      body: JSON.stringify(request_body),
      status: "pending",
    });

    const send_payment_order = (await axios({
      method: "POST",
      url: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/cc/txns/payment_order`,
      headers: request_header,
      data: request_body,
    })) as any;

    let payment_order = snakeCaseKeys(send_payment_order.data);
    if (send_payment_order.status != 200) {
      throw {
        status: send_payment_order.status,
        message:
          send_payment_order?.data?.error ||
          send_payment_order?.data?.errorCode ||
          "fail",
        data: payment_order || {},
      };
    }
    //update log payment success
    await Log_Payment.update(
      createRequest(),
      {
        response: JSON.stringify(payment_order),
        status: "success",
        update_date: new Date(),
      },
      {
        id: outbound_id,
        payment_method: "credit_cart_payment_order",
      }
    );
    return {
      status: 200,
      message: "success",
      data: {
        ...payment_order,
        payment_method: payment_method,
        service_id: service_id,
      },
    };
  } catch (error) {
    //update log payment error
    await Log_Payment.update(
      createRequest(),
      {
        error_message: JSON.stringify(error),
        status: "fail",
        update_date: new Date(),
      },
      {
        id: outbound_id,
        payment_method: "credit_cart_payment_order",
      }
    );
    return {
      status: error?.status || error?.response?.status || 500,
      message: error?.response?.data?.error || error?.message || error,
      data: error?.data || error?.response?.data || {},
    };
  }
};
//[Credit Cart] สร้าง Order รายการชำระเงิน โดยชำระเงินจากบัตรที่บันทึกไว้
export const creditCartPaymentWithCardToken = async (data_body: any) => {
  try {
    let secret_key = data_body?.secret_key;
    let request_body = {
      order_id: "order_001",
      product_name: "product_name1",
      service_id: "19100061935133847",
      channel_type: "API",
      cust_id: "c08172221839",
      amount: 100.5,
      currency: "THB",
      ref_1: "reference1",
      ref_2: "reference2",
      ref_3: "reference3",
      ref_4: "reference4",
      ref_5: "refernece5",
      capture: true,
      form_type: "FORM",
      card: {
        card_ref: "some text",
        card_cvv: "some text",
      },
      metadata: {
        key1: "value1",
        key2: "value2",
      },
      "3ds": {
        "3ds_required": true,
        "3ds_url_success": "https://yoursuccessurl.com",
        "3ds_url_fail": "https://yourfailurl.com",
      },
    };

    const signature = await encryptSignature(request_body, secret_key);
    if (signature.status != 200) {
      return { status: signature.status, message: signature.message };
    }

    let request_header = {
      "Content-Type": "application/json; charset=UTF-8",
      "X-sdpg-nonce": signature.data.nonce,
      "X-sdpg-merchant-id": process.env.MPAY_MERCHANT_ID,
      "X-sdpg-signature": signature.data.signature,
    };

    const payment_order = (await axios({
      method: "POST",
      url: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/cc/txns/payment_order`,
      headers: request_header,
      data: request_body,
    })) as any;

    if (payment_order) {
    }

    return {
      status: 200,
      message: "success",
      data: payment_order,
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
};
//[Credit Cart] เรียกบัตร Credit Cart ที่บันทึกไว้
export const creditCartInquiryCardToken = async (data_body: any) => {
  try {
    let secret_key = data_body?.secret_key;
    let request_body = {
      service_id: "19100061935133847",
      card_ref: "dcc217ebdcd4430b9b0fd64cf2838533",
    };

    const signature = await encryptSignature(request_body, secret_key);
    if (signature.status != 200) {
      return { status: signature.status, message: signature.message };
    }

    let request_header = {
      "Content-Type": "application/json; charset=UTF-8",
      "X-sdpg-nonce": signature.data.nonce,
      "X-sdpg-merchant-id": process.env.MPAY_MERCHANT_ID,
      "X-sdpg-signature": signature.data.signature,
    };

    const payment_order = (await axios({
      method: "POST",
      url: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/cc/cards/inquiry`,
      headers: request_header,
      data: request_body,
    })) as any;

    if (payment_order) {
    }

    return {
      status: 200,
      message: "success",
      data: payment_order,
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
};
//[Credit Cart] ลบบัตร Credit Cart ที่บันทึกไว้
export const creditCartTeminateCardToken = async (data_body: any) => {
  try {
    let secret_key = data_body?.secret_key;
    let request_body = {
      service_id: "19100061935133847",
      card_ref: "dcc217ebdcd4430b9b0fd64cf2838533",
    };

    const signature = await encryptSignature(request_body, secret_key);
    if (signature.status != 200) {
      return { status: signature.status, message: signature.message };
    }

    let request_header = {
      "Content-Type": "application/json; charset=UTF-8",
      "X-sdpg-nonce": signature.data.nonce,
      "X-sdpg-merchant-id": process.env.MPAY_MERCHANT_ID,
      "X-sdpg-signature": signature.data.signature,
    };

    const payment_order = (await axios({
      method: "POST",
      url: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/cc/cards/unregister`,
      headers: request_header,
      data: request_body,
    })) as any;

    if (payment_order) {
    }

    return {
      status: 200,
      message: "success",
      data: payment_order,
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
};
//[Credit Cart] ยืนยันการชำระเงิน
export const creditCartCaptureAuthorized = async (data_body: any) => {
  try {
    let secret_key = data_body?.secret_key;
    let request_body = {
      service_id: "19100061935133847",
      txn_id: "T20394059002930495059",
      amount: "100",
      currency: "THB",
    };

    const signature = await encryptSignature(request_body, secret_key);
    if (signature.status != 200) {
      return { status: signature.status, message: signature.message };
    }

    let request_header = {
      "Content-Type": "application/json; charset=UTF-8",
      "X-sdpg-nonce": signature.data.nonce,
      "X-sdpg-merchant-id": process.env.MPAY_MERCHANT_ID,
      "X-sdpg-signature": signature.data.signature,
    };

    const payment_order = (await axios({
      method: "POST",
      url: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/cc/txns/authorize/capture`,
      headers: request_header,
      data: request_body,
    })) as any;

    if (payment_order) {
    }

    return {
      status: 200,
      message: "success",
      data: payment_order,
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
};
//[Credit Cart] ยกเลิกการชำระเงิน
export const creditCartCancelAuthorized = async (data_body: any) => {
  try {
    let secret_key = data_body?.secret_key;
    let request_body = {
      service_id: "19100061935133847",
      txn_id: "T20394059002930495059",
    };

    const signature = await encryptSignature(request_body, secret_key);
    if (signature.status != 200) {
      return { status: signature.status, message: signature.message };
    }

    let request_header = {
      "Content-Type": "application/json; charset=UTF-8",
      "X-sdpg-nonce": signature.data.nonce,
      "X-sdpg-merchant-id": process.env.MPAY_MERCHANT_ID,
      "X-sdpg-signature": signature.data.signature,
    };

    const payment_order = (await axios({
      method: "POST",
      url: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/cc/txns/authorize/cancel`,
      headers: request_header,
      data: request_body,
    })) as any;

    if (payment_order) {
    }

    return {
      status: 200,
      message: "success",
      data: payment_order,
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
};
//************ END Credit Cart ************/

//************ Credit Card Payment (Seamless) ************/
//[Credit Cart (Seamless)] สร้าง Order รายการชำระเงิน
export const creditCartSeamlessPaymentOrder = async (data_body: any) => {
  try {
    //service
    //CreditCart VS/MC/JCB: MPAY_SERVICE_CC_MB_QRPP
    //Credit Card (Full)-Union Pay: MPAY_SERVICE_CREDIT_CARD_UP
    //Credit Card (Full)-Amex: MPAY_SERVICE_CREDIT_CARD_AM
    let request_body = {
      amount: 20,
      currency: "THB",
      order_id: "Test0000027",
      service_id: "20820062029422507",
      channel_type: "APPLICATION",
      cust_id: "33553",
      product_name: "merProductName",
      form_type: "SEAMLESS",
      "3ds": {
        "3ds_required": false,
        "3ds_url_success": "www.success.com",
        "3ds_url_fail": "www.fail.com",
      },
    };
    let secret_key = data_body?.secret_key;
    const signature = await encryptSignature(request_body, secret_key);
    if (signature.status != 200) {
      return { status: signature.status, message: signature.message };
    }

    let request_header = {
      "Content-Type": "application/json; charset=UTF-8",
      "X-sdpg-nonce": signature.data.nonce,
      "X-sdpg-merchant-id": process.env.MPAY_MERCHANT_ID,
      "X-sdpg-signature": signature.data.signature,
    };

    const send_payment_order = (await axios({
      method: "POST",
      url: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/cc/txns/payment_order`,
      headers: request_header,
      data: request_body,
    })) as any;

    let payment_order = snakeCaseKeys(send_payment_order);
    if (payment_order.status != 200) {
      throw {
        status: payment_order.status,
        message:
          payment_order?.data?.error ||
          payment_order?.data?.errorCode ||
          "fail",
        data: payment_order?.data || {},
      };
    }

    return {
      status: 200,
      message: "success",
      data: payment_order,
    };
  } catch (error) {
    return {
      status: error?.status || 500,
      message: error?.message || error,
      data: error?.data || {},
    };
  }
};
//[Credit Cart (Seamless)] ยืนยันการชำระเงิน
export const creditCartSeamlessPaymentConfirm = async (data_body: any) => {
  try {
    let request_body = {
      txn_id: "T2206810070450688042",
      token_id: "eba8976d66b2462b814fc32d2d24b3a2",
      card_ref: "1100e32f03f545edb9735e2a80a16719",
      card_cvv: "123",
      card_is_remember: false,
    };
    let secret_key = data_body?.secret_key;
    const signature = await encryptSignature(request_body, secret_key);
    if (signature.status != 200) {
      return { status: signature.status, message: signature.message };
    }

    let request_header = {
      "Content-Type": "application/json; charset=UTF-8",
      "X-sdpg-nonce": signature.data.nonce,
      "X-sdpg-merchant-id": process.env.MPAY_MERCHANT_ID,
      "X-sdpg-signature": signature.data.signature,
    };

    const payment_order = (await axios({
      method: "POST",
      url: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/cc/txns/payment_ref`,
      headers: request_header,
      data: request_body,
    })) as any;

    if (payment_order) {
    }

    return {
      status: 200,
      message: "success",
      data: payment_order,
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
};
//************ END Credit Card Payment (Seamless) ************/

//************ QR Payment ************/
//[QR Payment] สร้าง QR Payment ( payment_method: "qr_payment_order")
export const qrPaymentGenerateQR = async (data_body: any) => {
  const outbound_id = uuidv4();
  try {
    let service_id = data_body?.service_id;
    let secret_key: string = data_body?.secret_key;
    let payment_method = "QR Promptpay (Tag30)-Fix Rate";
    let expire_time_seconds = process.env.MPAY_QR_EXPIRE_TIME_SECONDS;
    let request_body = {
      order_id: data_body.order_id,
      product_name: data_body.product_payment,
      sof: "PROMPTPAY",
      service_id: service_id,
      //terminal_id: "19100061935189003",
      //location_name: "Shop-01",
      amount: data_body.amount,
      currency: "THB",
      expire_time_seconds: expire_time_seconds,
      ref_1: data_body?.ref_1 || "",
      ref_2: data_body?.ref_2 || "",
      ref_3: data_body?.ref_3 || "",
      ref_4: data_body?.ref_4 || "",
      ref_5:data_body?.ref_5 || "",
      // metadata: {
      //   product_name: "car",
      //   color: "red",
      // },
    };

    const signature = await encryptSignature(request_body, secret_key);
    if (signature.status != 200) {
      return { status: signature.status, message: signature.message };
    }

    let request_header = {
      "Content-Type": "application/json; charset=UTF-8",
      "X-sdpg-nonce": signature.data.nonce,
      "X-sdpg-merchant-id":
        data_body?.merchant_id || process.env.MPAY_MERCHANT_ID,
      "X-sdpg-signature": signature.data.signature,
    };

    //insert log payment
    await Log_Payment.insert(createRequest(), {
      id: outbound_id,
      type: "outbound",
      method: "POST",
      channel_payment: process.env.MPAY_CHANNEL_NAME,
      payment_method: "qr_payment_order",
      order_id: data_body.order_id,
      origin: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/qr`,
      header: JSON.stringify(request_header),
      body: JSON.stringify(request_body),
      status: "pending",
    });

    const send_payment_order = (await axios({
      method: "POST",
      url: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/qr`,
      headers: request_header,
      data: request_body,
    })) as any;

    let payment_order = snakeCaseKeys(send_payment_order.data);
    if (send_payment_order.status != 200) {
      throw {
        status: send_payment_order.status,
        message:
          send_payment_order.error || send_payment_order.errorCode || "fail",
        data: payment_order || {},
      };
    }
    //console.log(payment_order.data);
    //update log payment success
    await Log_Payment.update(
      createRequest(),
      {
        response: JSON.stringify(payment_order),
        status: "success",
        update_date: new Date(),
      },
      {
        id: outbound_id,
        payment_method: "qr_payment_order",
      }
    );

    return {
      status: 200,
      message: "success",
      data: {
        ...payment_order,
        payment_method: payment_method,
        service_id: service_id,
        expire_time_seconds: expire_time_seconds,
      },
    };
  } catch (error) {
    //update log payment error
    await Log_Payment.update(
      createRequest(),
      {
        error_message: JSON.stringify(error),
        status: "fail",
        update_date: new Date(),
      },
      {
        id: outbound_id,
        payment_method: "qr_payment_order",
      }
    );
    return {
      status: error?.status || error?.response?.status || 500,
      message: error?.response?.data?.error || error?.message || error,
      data: error?.data || error?.response?.data || {},
    };
  }
};
//************ END QR Payment ************/

//************ Internet/Mobile Banking ************/
//[Internet/Mobile Banking] สร้างรายการชำระสำหรับชำระผ่าน mobile banking
export const bankingPaymentOrder = async (data_body: any) => {
  const outbound_id = uuidv4();
  try {
    let secret_key: string = data_body?.secret_key;
    //service: MPAY_SERVICE_CC_MB_QRPP
    //Bank Code: 002 = BBL 004 = KBANK 006 = KTB 014 = SCB 025 = BAY
    let bank_code: string;
    switch (data_body.bank_name) {
      case "BBL":
        bank_code = "002";
        break;
      case "KBANK":
        bank_code = "004";
        break;
      case "KTB":
        bank_code = "006";
        break;
      case "SCB":
        bank_code = "014";
        break;
      case "BAY":
        bank_code = "025";
        break;
    }
    let service_id = data_body?.service_id;
    let payment_method = "Mobile/Internet Banking";
    let request_body = {
      service_id: service_id,
      channel_type: "APPLICATION", //WEBSITE, APPLICATION, KIOSK
      cust_id: data_body.customer_id,
      product_name: data_body.product_payment,
      order_id: data_body.order_id,
      bank_code: bank_code,
      ref_1: data_body?.ref_1 || "",
      ref_2: data_body?.ref_2 || "",
      ref_3: data_body?.ref_3 || "",
      ref_4: data_body?.ref_4 || "",
      ref_5:data_body?.ref_5 || "",
      currency: "THB",
      amount: data_body.amount,
      redirect_urls: {
        url_success: data_body.redirect_url_success,
        url_fail: data_body.redirect_url_fail,
      },
    };

    const signature = await encryptSignature(request_body, secret_key);
    if (signature.status != 200) {
      return { status: signature.status, message: signature.message };
    }

    let request_header = {
      "Content-Type": "application/json; charset=UTF-8",
      "X-sdpg-nonce": signature.data.nonce,
      "X-sdpg-merchant-id":
        data_body?.merchant_id || process.env.MPAY_MERCHANT_ID,
      "X-sdpg-signature": signature.data.signature,
    };

    //insert log payment
    await Log_Payment.insert(createRequest(), {
      id: outbound_id,
      type: "outbound",
      method: "POST",
      channel_payment: process.env.MPAY_CHANNEL_NAME,
      payment_method: "banking_payment_order",
      order_id: data_body.order_id,
      origin: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/ib/payment_order`,
      header: JSON.stringify(request_header),
      body: JSON.stringify(request_body),
      status: "pending",
    });

    const send_payment_order = (await axios({
      method: "POST",
      url: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/ib/payment_order`,
      headers: request_header,
      data: request_body,
    })) as any;

    let payment_order = snakeCaseKeys(send_payment_order.data);
    if (send_payment_order.status != 200) {
      throw {
        status: send_payment_order.status,
        message:
          send_payment_order?.data?.error ||
          send_payment_order?.data?.errorCode ||
          "fail",
        data: payment_order || {},
      };
    }

    //update log payment success
    await Log_Payment.update(
      createRequest(),
      {
        response: JSON.stringify(payment_order),
        status: "success",
        update_date: new Date(),
      },
      {
        id: outbound_id,
        payment_method: "banking_payment_order",
      }
    );

    return {
      status: 200,
      message: "success",
      data: {
        ...payment_order,
        bank_code: bank_code,
        bank_name: data_body.bank_name,
        payment_method: payment_method,
        service_id: service_id,
      },
    };
  } catch (error) {
    //update log payment error
    await Log_Payment.update(
      createRequest(),
      {
        error_message: JSON.stringify(error),
        status: "fail",
        update_date: new Date(),
      },
      {
        id: outbound_id,
        payment_method: "banking_payment_order",
      }
    );
    return {
      status: error?.status || error?.response?.status || 500,
      message: error?.response?.data?.error || error?.message || error,
      data: error?.data || error?.response?.data || {},
    };
  }
};
//************ END Internet/Mobile Banking ************/

//************ Enquiry ************/
//[Enquiry] ดูรายการชำระเงิน
export const enquiry = async (order_id: string) => {
  try {
    let request_body = {
      //txn_id: " T2217415362179146106",
      // หรือ
      order_id: order_id,
    };

    const payment = await Transaction_Payment.findOne(createRequest(), {
      order_id: order_id,
    });

    if (!payment) {
      return {
        status: 400,
        message: "ไม่พบรายการ",
      };
    }

    let secret_key = payment?.secret_key || process.env.MPAY_SECRET_KEY;
    const signature = await encryptSignature(request_body, secret_key);
    if (signature.status != 200) {
      return { status: signature.status, message: signature.message };
    }

    let request_header = {
      "Content-Type": "application/json; charset=UTF-8",
      "X-sdpg-nonce": signature.data.nonce,
      "X-sdpg-merchant-id": payment?.merchant_id || process.env.MPAY_MERCHANT_ID,
      "X-sdpg-signature": signature.data.signature,
    };

    // console.log("MPAY request_header ===>", request_header);
    // console.log("MPAY request_body ===>", request_body);

    const enquiry = (await axios({
      method: "POST",
      url: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/enquiry`,
      headers: request_header,
      data: request_body,
    })) as any;

    let enquiry_data = snakeCaseKeys(enquiry.data);
    if (enquiry.status != 200) {
      return {
        status: enquiry.status,
        message: enquiry?.data?.error || enquiry?.data?.errorCode || "fail",
        data: enquiry_data || {},
      };
    }

    return {
      status: 200,
      message: "success",
      data: enquiry_data,
    };
  } catch (error) {
    return {
      status: error?.status || error?.response?.status || 500,
      message: error?.response?.data?.error || error?.message || error,
      data: error?.data || error?.response?.data || {},
    };
  }
};
//************ END Enquiry ************/

//create Signature
function encryptSignature(data_body: any, secret_key: string) {
  try {
    //let channel_secret = process.env.MPAY_SECRET_KEY;
    let channel_secret = secret_key;
    let nonce = uuidv4();
    let signature = "";
    signature = crypto
      .createHmac("sha256", channel_secret)
      .update(JSON.stringify(data_body) + nonce)
      .digest("hex");

    return {
      status: 200,
      message: "success",
      data: { signature: signature, nonce: nonce },
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
}
