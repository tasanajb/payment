import express from "express";
import mpay from "./service-gateway/mpay";
import kbank from "./service-gateway/kbank";
import product from "./product";

const app = express.Router();
app.use("/mpay", mpay);
app.use("/kbank", kbank);
app.use("/product", product);
export default app;