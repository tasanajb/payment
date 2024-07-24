import express from "express";
import * as gateway from "../mpay/gateway";
import {withAuthen} from "../../../middlewares/with-authen";

const app = express.Router();
app.post("/payment/order", withAuthen, gateway.paymentOrder);
app.post("/callback", gateway.callback);
app.post("/enquiry", gateway.enquiryapi);
app.post("/enquiry/callback", gateway.enquiryCallbackToProduct);
export default app;