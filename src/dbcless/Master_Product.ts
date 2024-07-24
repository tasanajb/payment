import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_ProductMethod {
  load(request: Request, id: number | IMaster_Product): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Product): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Product {
    id?: number;
    client_id?: string;
    secret_key?: string;
    product_name?: string;
    product_link?: string;
}

export class Master_Product implements IMaster_Product, IMaster_ProductMethod {
    id?: number;
    client_id?: string;
    secret_key?: string;
    product_name?: string;
    product_link?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Product",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    client_id: { name: "ClientID", type: sql.NVarChar, is_identity: false, is_primary: false },
    secret_key: { name: "SecretKey", type: sql.NVarChar, is_identity: false, is_primary: false },
    product_name: { name: "ProductName", type: sql.NVarChar, is_identity: false, is_primary: false },
    product_link: { name: "ProductLink", type: sql.NVarChar, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","client_id","secret_key","product_name","product_link"]
  );

  constructor(request?: Request | IMaster_Product, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Product);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Product.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Product): void {
    this.id = data.id;
    this.client_id = data.client_id;
    this.secret_key = data.secret_key;
    this.product_name = data.product_name;
    this.product_link = data.product_link;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Product.insert(request, {
      id: this.id,
      client_id: this.client_id,
      secret_key: this.secret_key,
      product_name: this.product_name,
      product_link: this.product_link,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Product.update(request, {
      id: this.id,
      client_id: this.client_id,
      secret_key: this.secret_key,
      product_name: this.product_name,
      product_link: this.product_link,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Product.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Product): Promise<Master_Product[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Product(item));
  }

  static async findOne(request: Request, condition: IMaster_Product): Promise<Master_Product> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any  : new Master_Product(item);
  }

  static async count(request: Request, condition: IMaster_Product): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Product): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Product, condition: IMaster_Product): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Product): Promise<void> {
      return this.builder.delete(request, condition);
  }
}