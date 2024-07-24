import { NextFunction, Request, Response } from "express";
import { createRequest } from "../config";
import _ from "lodash";
import crypto from "crypto";
import { Master_Product } from "../../src/dbcless";

export const withAuthen = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      req.headers["gateway-api-signature"] &&
      req.headers["gateway-api-client-id"]
    ) {
      const client_id = String(req.headers["gateway-api-client-id"]);
      const product = await Master_Product.findOne(createRequest(), {
        client_id: client_id,
      });
      if (product) {
        let signature = "";
        signature = crypto
          .createHmac("sha256", product.secret_key)
          .update(product.client_id + product.secret_key)
          .digest("hex");
        if (signature === req.headers["gateway-api-signature"]) {
          req.client_id = product.client_id;
          req.product_name = product.product_name;

          next();
        } else {
          throw new Error("Invalid signature.");
        }
      } else {
        throw new Error("Unauthorized.");
      }
    } else {
      throw new Error("Unauthorized.");
    }
  } catch (error) {
    res
      .status(401)
      .send({ status: 401, message: error.message });
  }
};
