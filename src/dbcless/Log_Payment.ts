import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ILog_PaymentMethod {
  load(request: Request, id: string | ILog_Payment): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: string): Promise<void>;
  loadByData(data: ILog_Payment): void;
  insert(request: Request): Promise<string | number>;
}

export interface ILog_Payment {
    id?: string;
    type?: string;
    method?: string;
    channel_payment?: string;
    payment_method?: string;
    order_id?: string;
    origin?: string;
    header?: string;
    body?: string;
    response?: string;
    status?: string;
    create_date?: Date;
    update_date?: Date;
    error_message?: string;
}

export class Log_Payment implements ILog_Payment, ILog_PaymentMethod {
    id?: string;
    type?: string;
    method?: string;
    channel_payment?: string;
    payment_method?: string;
    order_id?: string;
    origin?: string;
    header?: string;
    body?: string;
    response?: string;
    status?: string;
    create_date?: Date;
    update_date?: Date;
    error_message?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Log_Payment",
    {
    id: { name: "Id", type: sql.NVarChar, is_identity: false, is_primary: true },
    type: { name: "Type", type: sql.NVarChar, is_identity: false, is_primary: false },
    method: { name: "Method", type: sql.NVarChar, is_identity: false, is_primary: false },
    channel_payment: { name: "ChannelPayment", type: sql.NVarChar, is_identity: false, is_primary: false },
    payment_method: { name: "PaymentMethod", type: sql.NVarChar, is_identity: false, is_primary: false },
    order_id: { name: "OrderId", type: sql.NVarChar, is_identity: false, is_primary: false },
    origin: { name: "Origin", type: sql.NVarChar, is_identity: false, is_primary: false },
    header: { name: "Header", type: sql.NVarChar, is_identity: false, is_primary: false },
    body: { name: "Body", type: sql.NVarChar, is_identity: false, is_primary: false },
    response: { name: "Response", type: sql.NText, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    error_message: { name: "ErrorMessage", type: sql.NText, is_identity: false, is_primary: false }
    },
    [],
    ["id","type","method","channel_payment","payment_method","order_id","origin","header","body","response","status","create_date","update_date","error_message"]
  );

  constructor(request?: Request | ILog_Payment, id?: string) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ILog_Payment);
    }
  }

  async load(request: Request, id: string): Promise<void> {
      const item = await Log_Payment.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ILog_Payment): void {
    this.id = data.id;
    this.type = data.type;
    this.method = data.method;
    this.channel_payment = data.channel_payment;
    this.payment_method = data.payment_method;
    this.order_id = data.order_id;
    this.origin = data.origin;
    this.header = data.header;
    this.body = data.body;
    this.response = data.response;
    this.status = data.status;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
    this.error_message = data.error_message;
  }

  insert(request: Request): Promise<string | number> {
    return Log_Payment.insert(request, {
      id: this.id,
      type: this.type,
      method: this.method,
      channel_payment: this.channel_payment,
      payment_method: this.payment_method,
      order_id: this.order_id,
      origin: this.origin,
      header: this.header,
      body: this.body,
      response: this.response,
      status: this.status,
      create_date: this.create_date,
      update_date: this.update_date,
      error_message: this.error_message,
    });
  }

  update(request: Request): Promise<void> {
    return Log_Payment.update(request, {
      id: this.id,
      type: this.type,
      method: this.method,
      channel_payment: this.channel_payment,
      payment_method: this.payment_method,
      order_id: this.order_id,
      origin: this.origin,
      header: this.header,
      body: this.body,
      response: this.response,
      status: this.status,
      create_date: this.create_date,
      update_date: this.update_date,
      error_message: this.error_message,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: string): Promise<void> {
    return Log_Payment.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ILog_Payment): Promise<Log_Payment[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Log_Payment(item));
  }

  static async findOne(request: Request, condition: ILog_Payment): Promise<Log_Payment> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null  as any: new Log_Payment(item);
  }

  static async count(request: Request, condition: ILog_Payment): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ILog_Payment): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ILog_Payment, condition: ILog_Payment): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ILog_Payment): Promise<void> {
      return this.builder.delete(request, condition);
  }
}