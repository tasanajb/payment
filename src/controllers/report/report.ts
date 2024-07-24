import { NextFunction, Request, Response } from "express";
import { createRequest } from "../../config";
import { v4 as uuidv4 } from "uuid";

export const report = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const inbound_id = uuidv4();
  try {
    const get_payment: any = await createRequest().query(
      `SELECT FORMAT(p.CreateDate,'dd/MM/yyyy hh:mm tt') as DateTime, p.ChannelPayment as Channel, p.MerchantId as MerchantID, 
      p.DeveloperCode as CompID, p.OrderId as Ref, p.Amount, p.PaymentMethod,
      CASE
          WHEN r.Type = 'จำนวนเต็ม' THEN CAST(r.MrdPayToMpay as numeric(10,2))
          ELSE CAST(((p.Amount * (r.MrdPayToMpay /100))) as numeric(10,2))
      END as  MRDPaytomPAY,
      CASE
          WHEN r.Type = 'จำนวนเต็ม' THEN CAST(r.MrdMerchant as numeric(10,2))
          ELSE CAST(((p.Amount * (r.MrdMerchant /100))) as numeric(10,2))
      END as  MRDMerchant,
      CASE
          WHEN r.Type = 'จำนวนเต็ม' THEN CAST(r.SharingToIcon as numeric(10,2))
          ELSE CAST((p.Amount * (r.SharingToIcon /100)) as numeric(10,2))
      END as  SharingtoICON 
      FROM Transaction_Payment p
      LEFT JOIN Master_Fee_Rate r ON p.PaymentMethod = r.PaymentMethod
      WHERE PaymentStatus = 'SUCCESS'`
    );

    res.status(200).send({ status: 200, message: "success", data: {} });
  } catch (error) {
    res.status(500).send({ status: 500, message: error?.message || error });
  }
};
