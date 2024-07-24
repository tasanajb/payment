
import { NextFunction, Request, Response } from "express";
import { createRequest } from "../../config";
import { snakeCaseKeys } from "../../utilities";
import sql from "mssql";
import { Master_Product } from "../../dbcless";

export const createNewProduct = async (
    req: Request,
    res: Response,
    next: NextFunction) => {
    try {
        const { product_name, product_link } = req.body;
  
      const product: any = await createRequest()
        .input("product_name", sql.NChar, product_name)
        .input("product_link", sql.NChar, product_link)
        .input("node_env", sql.NChar, process.env.NODE_ENV)
        .query(`
          DECLARE @client_id AS VARCHAR(32) = CONVERT(NVARCHAR(32),HashBytes('MD5', CONCAT('cic0nte@m',@node_env,LOWER(REPLACE(@product_name, ' ', '')))),2)
          DECLARE @secret_key AS VARCHAR(32) = CONVERT(NVARCHAR(32),HashBytes('MD5', CONCAT('sic0nte@m',@node_env,LOWER(REPLACE(@product_name, ' ', '')))),2)
          DECLARE @message AS VARCHAR(500) = 'Duplicate product.'
        
          IF NOT EXISTS (SELECT * FROM Master_Product WHERE ProductName = @product_name)
          BEGIN
            INSERT INTO Master_Product ( 
              [ClientID]
              ,[SecretKey]
              ,[ProductName]
              ,[ProductLink])
            VALUES (@client_id, 
            @secret_key, 
            @product_name,
            ISNULL(@product_link,''));

            SET @message = 'Successfully created.'
          END

          SELECT * FROM  Master_Product WHERE ProductName = @product_name
          SELECT @message as message
        `)
              
        let product_data = snakeCaseKeys(product.recordsets[0][0]);
        res.status(200).send({ status: 200, message: snakeCaseKeys(product.recordsets[1][0].message) || "success", data: product_data });
    }
    catch (error) {
        res.status(500).send({ status: 500, message: error });
    }
}

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction) => {
  try {
    const { client_id, product_link } = req.body;
    
    await Master_Product.update(createRequest(), {
      product_link: product_link
    },{
      client_id: client_id
    })

      res.status(200).send({ status: 200, message: "success" });
  }
  catch (error) {
      res.status(500).send({ status: 500, message: error });
  }
}