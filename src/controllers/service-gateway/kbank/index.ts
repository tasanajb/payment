import express from "express";
import * as gateway from "../kbank/gateway";
import {withAuthen} from "../../../middlewares/with-authen";

const app = express.Router();
app.post("/payment/create", withAuthen, gateway.createPayment)
app.get("/payment/qr/order/:id", withAuthen, gateway.getOrder)
app.get("/payment/qr/inquiry/:charge_id", withAuthen, gateway.getQrInquiry)
app.get("/payment/qr/:qr_id/cancel", withAuthen, gateway.cancelQr)
app.get("/payment/card/inquiry/:charge_id", withAuthen, gateway.getCardInquiry)
app.post("/callback", gateway.callback)
app.post("/notify/card", gateway.notify)
app.post("/notify/qr", gateway.notify)
// app.post("/notify/alipay", gateway.callback)
// app.post("/notify/wechat", gateway.callback)
export default app;