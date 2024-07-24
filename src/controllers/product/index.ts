import express from "express";
import * as product from "../product/product";

const app = express.Router();
app.post("/create", product.createNewProduct)
app.post("/update",product.updateProduct)
export default app;