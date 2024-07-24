import { NextFunction, Request, Response } from "express";
import { createRequest } from "../../../config";
import crypto from "crypto";
import * as mpay from "./gateway-mpay";
import { v4 as uuidv4 } from "uuid";
import {
  Log_Payment,
  Log_Api,
  Transaction_Payment,
  Master_Product,
} from "../../../dbcless";
import axios from "axios";
import { snakeCaseKeys } from "../../../utilities";
import sql from "mssql";
import * as yup from "yup";
import { generateOrderNumber } from "../../../utilities/common"

const schema = yup.object({
  callback_url: yup.string().required(),
  payment_type: yup.string().required(),
  amount: yup.number().required(),
  merchant_id: yup.string().required(),
  secret_key: yup.string().required(),
  service_id: yup.string().required(),
  developer_code: yup.string().required(),
  customer_id: yup.string().required(),
});

//create order รายการชำระเงิน
export const paymentOrder = async (
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
      origin: `${process.env.URL}/mpay/payment/order`,
      header: JSON.stringify(req.headers),
      body: JSON.stringify(req.body),
    });

    const {
      callback_url,
      payment_type, //ประเภทการชำระเงิน (CREDIT_CARD , MOBILE_BANKING, QR_PROMPTPAY)
      credit_card_type, //ใช้สำหรับแยกประเภท credit cart (VISA, JCB, MASTERCARD, UNIONPAY, AMEX)
      bank_name, //ใช้ใส่ธนาคาร กรณีชำระแบบ mobile banking (BBL , KBANK , KTB , SCB , BAY)
      redirect_url_success,
      redirect_url_fail,
      amount,
      merchant_id,
      secret_key,
      service_id,
      developer_code,
      customer_id,
      term_id,
      term_name,
      ref_1,
      ref_2,
      ref_3,
      ref_4,
      ref_5
    } = req.body;

    await schema.validate({
      callback_url,
      payment_type,
      amount,
      merchant_id,
      secret_key,
      service_id,
      developer_code,
      customer_id,
    }, {
      abortEarly: false,
      stripUnknown: false,
      strict: true,
    }).catch((error: any) => {
      throw { status: 400, message: error.errors[0] || error.message, data: {} };
    });

    let order_payment: any = {};
    let order_id: string;
    order_id = await generateOrderNumber();
    req.body.product_payment = req?.product_name;
    req.body.order_id = order_id;
    if (payment_type === "CREDIT_CARD") {
      await yup.object({
        credit_card_type: yup.string().required(),
      }).validate({ credit_card_type }).catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message, data: {} };
      })
      order_payment = await mpay.creditCartPaymentOrder(req.body);
    }
    if (payment_type === "MOBILE_BANKING") {
      await yup.object({
        bank_name: yup.string().required(),
      }).validate({ bank_name }).catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message, data: {} };
      })
      order_payment = await mpay.bankingPaymentOrder(req.body);
    }
    if (payment_type === "QR_PROMPTPAY") {
      order_payment = await mpay.qrPaymentGenerateQR(req.body);
    }

    //บันทึกข้อมูลการจ่ายเงิน
    if (order_payment && order_payment.status == 200) {
      //insert data ตาราง transection_payment status: PENDING
      await Transaction_Payment.insert(createRequest(), {
        order_id: order_payment?.data?.order_id,
        txn_id: order_payment?.data?.txn_id,
        channel_payment: process.env.MPAY_CHANNEL_NAME,
        product_payment: req?.product_name,
        client_id: req.client_id,
        callback_url: callback_url,
        payment_method: order_payment?.data?.payment_method,
        service_id: order_payment?.data?.service_id,
        customer_id: customer_id,
        amount: amount,
        amount_net: order_payment?.data?.amount_net,
        amount_cust_fee: order_payment?.data?.amount_cust_fee,
        currency: order_payment?.data?.currency || "THB",
        merchant_id: merchant_id,
        secret_key: secret_key,
        term_id: term_id,
        term_name: term_name,
        txn_token: order_payment?.data?.txn_token,
        ib_bank_code: order_payment?.data?.bank_code,
        ib_bank_name: order_payment?.data?.bank_name,
        qr_code: order_payment?.data?.qr_code,
        qr_expire: order_payment?.data?.qr_expire_at,
        qr_expire_time_seconds: order_payment?.data?.expire_time_seconds,
        developer_code: developer_code,
        ref_1: ref_1 || "",
        ref_2: ref_2 || "",
        ref_3: ref_3 || "",
        ref_4: ref_4 || "",
        ref_5: ref_5 || "",
        payment_status: "PENDING",
      });
      //update log api successs
      await Log_Api.update(
        createRequest(),
        {
          response: JSON.stringify(order_payment?.data),
          update_date: new Date(),
        },
        {
          id: inbound_id,
        }
      );
    } else {
      throw order_payment;
    }

    res
      .status(200)
      .send({ status: 200, message: "success", data: order_payment.data });
  } catch (error) {
    //update log api error
    await Log_Api.update(
      createRequest(),
      {
        error_message: JSON.stringify(error),
        update_date: new Date(),
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

//WebHook Notify
export const callback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const inbound_id = uuidv4();
  try {
    //insert log payment
    await Log_Payment.insert(createRequest(), {
      id: inbound_id,
      type: "inbound",
      method: "POST",
      channel_payment: process.env.MPAY_CHANNEL_NAME,
      payment_method: "callback",
      order_id: req.body.order_id,
      origin: `${process.env.URL}/mpay/callback`,
      body: JSON.stringify(req.body),
      status: "success",
    });
    //find payment จาก order_id
    const payment = await Transaction_Payment.findOne(createRequest(), {
      order_id: req.body.order_id,
    });
    if (payment && payment?.payment_status !== "SUCCESS" && payment?.payment_status !== "FAIL") {
      //update data ตาราง transection_payment status: SUCCESS
      await Transaction_Payment.update(
        createRequest(),
        {
          payment_status: req.body.status,
          card_ref: req?.body?.card?.card_ref,
          card_no: req?.body?.card?.card_no,
          card_type: req?.body?.card?.card_type,
          card_bank: req?.body?.card?.card_bank_issuer_name,
          card_expire: req?.body?.card?.card_expire,
          update_date: new Date(),
        },
        {
          order_id: req.body.order_id,
        }
      );
      //callback กลับไปให้ product นั้นๆ   
      const product = await Master_Product.findOne(createRequest(), {
        client_id: payment.client_id,
      });
      let product_url_callback = payment.callback_url || product.product_link;
      if (product_url_callback) {
        //callback to product
        axios({
          method: "POST",
          url: product_url_callback,
          data: req.body,
        })
          .then((data) => {
            console.log("product success");
          })
          .catch((err) => {
            console.log("product error");
          });
      }
    }
    res.status(200).send({ status: 200, message: "success" });
  } catch (error) {
    res.status(500).send({ status: 500, message: error?.message || error });
  }
};

export const enquiry = async () => {
  try {
    const get_payment: any = await createRequest().query(
      `
      SELECT *
      FROM Transaction_Payment
        WHERE PaymentStatus = 'PENDING'
        AND  getdate() >= DATEADD(MINUTE, +35, CreateDate)`
    );
    //let payment = snakeCaseKeys(get_payment.recordsets);
    for (var i in get_payment.recordset) {
      let payment = snakeCaseKeys(get_payment.recordset[i]);
      let order_id = payment.order_id;
      const enquiry = await mpay.enquiry(order_id);
      //console.log(enquiry);
      if (enquiry.status == 200) {
        if (enquiry.data.status !== "PENDING" && payment?.payment_status !== "SUCCESS" && payment?.payment_status !== "FAIL") {
          //update data ตาราง transection_payment status: SUCCESS
          await Transaction_Payment.update(
            createRequest(),
            {
              payment_status: enquiry?.data?.status,
              card_ref: enquiry?.data?.card?.card_ref,
              card_no: enquiry?.data?.card?.card_no,
              card_type: enquiry?.data?.card?.card_type,
              card_bank: enquiry?.data?.card?.card_bank_issuer_name,
              card_expire: enquiry?.data?.card?.card_expire,
              update_date: new Date(),
            },
            {
              order_id: order_id,
            }
          );

          //insert log payment
          await Log_Payment.insert(createRequest(), {
            id: uuidv4(),
            type: "outbound",
            method: "POST",
            channel_payment: process.env.MPAY_CHANNEL_NAME,
            payment_method: "enquiry",
            order_id: order_id,
            origin: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/enquiry`,
            response: JSON.stringify(enquiry.data),
            status: "success",
          });
          //callback กลับไปให้ product นั้นๆ
          const product = await Master_Product.findOne(createRequest(), {
            client_id: payment.client_id,
          });
          let product_url_callback = payment.callback_url || product.product_link;
          if (product_url_callback) {
            //callback to product
            axios({
              method: "POST",
              url: product_url_callback,
              data: enquiry.data,
            })
              .then((data) => {
                console.log("product success");
              })
              .catch((err) => {
                console.log("product error");
              });
          }
        } else {
          const log_payment = await Log_Payment.findOne(createRequest(), {
            channel_payment: process.env.MPAY_CHANNEL_NAME,
            payment_method: "enquiry",
            order_id: order_id,
          });

          if (!log_payment) {
            //insert log payment
            await Log_Payment.insert(createRequest(), {
              id: uuidv4(),
              type: "outbound",
              method: "POST",
              channel_payment: process.env.MPAY_CHANNEL_NAME,
              payment_method: "enquiry",
              order_id: order_id,
              origin: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/enquiry`,
              response: JSON.stringify(enquiry.data),
              status: "success",
            });
          } else {
            //insert log payment
            await Log_Payment.update(
              createRequest(),
              {
                response: JSON.stringify(enquiry.data),
                update_date: new Date(),
              },
              {
                channel_payment: process.env.MPAY_CHANNEL_NAME,
                payment_method: "enquiry",
                order_id: order_id,
              }
            );
          }
        }
      } else {
        await Log_Api.insert(createRequest(), {
          id: uuidv4(),
          type: "inbound",
          method: "POST",
          origin: "enquiry job",
          error_message: JSON.stringify({ ...enquiry, order_id: order_id }),
        });
      }
    }
    return true;
  } catch (error) {
    //insert log api error
    await Log_Api.insert(createRequest(), {
      id: uuidv4(),
      type: "inbound",
      method: "POST",
      origin: "enquiry job",
      error_message: JSON.stringify(error),
    });
    return false;
  }
};

export const enquiryapi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const enquiry = await mpay.enquiry(req.body.order_id);
    res.status(enquiry.status || 200).send({
      status: enquiry.status || 200,
      message: enquiry.message || "success",
      data: enquiry.data,
    });
  } catch (error) {
    res.status(500).send({ status: 500, message: error });
  }
};

export const enquiryCallbackToProduct = async (
  req: Request,
  res: Response,
  next: NextFunction) => {
  try {
    const enquiry = await mpay.enquiry(req.body.order_id);
    //console.log(enquiry);
    if (enquiry.status == 200) {
      if (enquiry.data.status !== "PENDING") {
        const payment = await Transaction_Payment.findOne(createRequest(), {
          order_id: req.body.order_id
        })
        //update data ตาราง transection_payment status: SUCCESS
        await Transaction_Payment.update(
          createRequest(),
          {
            payment_status: enquiry?.data?.status,
            card_ref: enquiry?.data?.card?.card_ref,
            card_no: enquiry?.data?.card?.card_no,
            card_type: enquiry?.data?.card?.card_type,
            card_bank: enquiry?.data?.card?.card_bank_issuer_name,
            card_expire: enquiry?.data?.card?.card_expire,
            update_date: new Date(),
          },
          {
            order_id: req.body.order_id,
          }
        );

        //insert log payment
        await Log_Payment.insert(createRequest(), {
          id: uuidv4(),
          type: "outbound",
          method: "POST",
          channel_payment: process.env.MPAY_CHANNEL_NAME,
          payment_method: "enquiry",
          order_id: req.body.order_id,
          origin: `${process.env.MPAY_API_URL}/service-txn-gateway/v1/enquiry`,
          response: JSON.stringify(enquiry.data),
          status: "success",
        });
        //callback กลับไปให้ product นั้นๆ
        const product = await Master_Product.findOne(createRequest(), {
          client_id: payment?.client_id,
        });
        let product_url_callback = payment.callback_url || product.product_link;
        if (product_url_callback) {
          //callback to product
          axios({
            method: "POST",
            url: product_url_callback,
            data: enquiry.data,
          })
            .then((data) => {
              console.log("product success");
            })
            .catch((err) => {
              console.log("product error");
            });
        }
      }
    } else {
      await Log_Api.insert(createRequest(), {
        id: uuidv4(),
        type: "inbound",
        method: "POST",
        origin: "enquiry",
        error_message: JSON.stringify({ ...enquiry, order_id: req.body.order_id }),
      });
    }
    res.status(enquiry.status || 200).send({
      status: enquiry.status || 200,
      message: enquiry.message || "success",
      data: enquiry.data,
    });
  } catch (error) {
    //insert log api error
    await Log_Api.insert(createRequest(), {
      id: uuidv4(),
      type: "inbound",
      method: "POST",
      origin: "enquiry job",
      error_message: JSON.stringify(error),
    });
    res.status(500).send({ status: 500, message: error });
  }
};

