import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_Order_PaymentMethod {
  load(request: Request, id: number | IMaster_Order_Payment): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Order_Payment): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Order_Payment {
    id?: number;
    order_id?: string;
    create_date?: Date;
    status?: string;
}

export class Master_Order_Payment implements IMaster_Order_Payment, IMaster_Order_PaymentMethod {
    id?: number;
    order_id?: string;
    create_date?: Date;
    status?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Order_Payment",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    order_id: { name: "OrderId", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","order_id","create_date","status"]
  );

  constructor(request?: Request | IMaster_Order_Payment, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Order_Payment);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Order_Payment.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Order_Payment): void {
    this.id = data.id;
    this.order_id = data.order_id;
    this.create_date = data.create_date;
    this.status = data.status;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Order_Payment.insert(request, {
      id: this.id,
      order_id: this.order_id,
      create_date: this.create_date,
      status: this.status,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Order_Payment.update(request, {
      id: this.id,
      order_id: this.order_id,
      create_date: this.create_date,
      status: this.status,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Order_Payment.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Order_Payment): Promise<Master_Order_Payment[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Order_Payment(item));
  }

  static async findOne(request: Request, condition: IMaster_Order_Payment): Promise<Master_Order_Payment> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any  : new Master_Order_Payment(item);
  }
  
  static async count(request: Request, condition: IMaster_Order_Payment): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Order_Payment): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Order_Payment, condition: IMaster_Order_Payment): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Order_Payment): Promise<void> {
      return this.builder.delete(request, condition);
  }
}