import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ITransaction_PaymentMethod {
  load(request: Request, id: number | ITransaction_Payment): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ITransaction_Payment): void;
  insert(request: Request): Promise<string | number>;
}

export interface ITransaction_Payment {
    id?: number;
    order_id?: string;
    txn_id?: string;
    reference_id?: string;
    channel_payment?: string;
    product_payment?: string;
    client_id?: string;
    callback_url?: string;
    redirect_url?: string;
    payment_method?: string;
    service_id?: string;
    customer_id?: string;
    amount?: number;
    amount_net?: number;
    amount_cust_fee?: number;
    currency?: string;
    merchant_id?: string;
    secret_key?: string;
    term_id?: string;
    term_name?: string;
    description?: string;
    txn_token?: string;
    card_ref?: string;
    card_no?: string;
    card_type?: string;
    card_expire?: string;
    card_bank?: string;
    ib_bank_code?: string;
    ib_bank_name?: string;
    qr_code?: string;
    qr_expire?: Date;
    qr_expire_time_seconds?: number;
    ref_1?: string;
    ref_2?: string;
    ref_3?: string;
    ref_4?: string;
    ref_5?: string;
    developer_code?: string;
    payment_status?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Transaction_Payment implements ITransaction_Payment, ITransaction_PaymentMethod {
    id?: number;
    order_id?: string;
    txn_id?: string;
    reference_id?: string;
    channel_payment?: string;
    product_payment?: string;
    client_id?: string;
    callback_url?: string;
    redirect_url?: string;
    payment_method?: string;
    service_id?: string;
    customer_id?: string;
    amount?: number;
    amount_net?: number;
    amount_cust_fee?: number;
    currency?: string;
    merchant_id?: string;
    secret_key?: string;
    term_id?: string;
    term_name?: string;
    description?: string;
    txn_token?: string;
    card_ref?: string;
    card_no?: string;
    card_type?: string;
    card_expire?: string;
    card_bank?: string;
    ib_bank_code?: string;
    ib_bank_name?: string;
    qr_code?: string;
    qr_expire?: Date;
    qr_expire_time_seconds?: number;
    ref_1?: string;
    ref_2?: string;
    ref_3?: string;
    ref_4?: string;
    ref_5?: string;
    developer_code?: string;
    payment_status?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Transaction_Payment",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    order_id: { name: "OrderId", type: sql.NVarChar, is_identity: false, is_primary: false },
    txn_id: { name: "TxnId", type: sql.NVarChar, is_identity: false, is_primary: false },
    reference_id: { name: "ReferenceId", type: sql.NVarChar, is_identity: false, is_primary: false },
    channel_payment: { name: "ChannelPayment", type: sql.NVarChar, is_identity: false, is_primary: false },
    product_payment: { name: "ProductPayment", type: sql.NVarChar, is_identity: false, is_primary: false },
    client_id: { name: "ClientId", type: sql.NVarChar, is_identity: false, is_primary: false },
    callback_url: { name: "CallbackUrl", type: sql.NVarChar, is_identity: false, is_primary: false },
    redirect_url: { name: "RedirectUrl", type: sql.NVarChar, is_identity: false, is_primary: false },
    payment_method: { name: "PaymentMethod", type: sql.NVarChar, is_identity: false, is_primary: false },
    service_id: { name: "ServiceId", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_id: { name: "CustomerId", type: sql.NVarChar, is_identity: false, is_primary: false },
    amount: { name: "Amount", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    amount_net: { name: "AmountNet", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    amount_cust_fee: { name: "AmountCustFee", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    currency: { name: "Currency", type: sql.NVarChar, is_identity: false, is_primary: false },
    merchant_id: { name: "MerchantId", type: sql.NVarChar, is_identity: false, is_primary: false },
    secret_key: { name: "SecretKey", type: sql.NVarChar, is_identity: false, is_primary: false },
    term_id: { name: "TermId", type: sql.NVarChar, is_identity: false, is_primary: false },
    term_name: { name: "TermName", type: sql.NVarChar, is_identity: false, is_primary: false },
    description: { name: "Description", type: sql.NVarChar, is_identity: false, is_primary: false },
    txn_token: { name: "TxnToken", type: sql.NVarChar, is_identity: false, is_primary: false },
    card_ref: { name: "CardRef", type: sql.NVarChar, is_identity: false, is_primary: false },
    card_no: { name: "CardNo", type: sql.NVarChar, is_identity: false, is_primary: false },
    card_type: { name: "CardType", type: sql.NVarChar, is_identity: false, is_primary: false },
    card_expire: { name: "CardExpire", type: sql.NVarChar, is_identity: false, is_primary: false },
    card_bank: { name: "CardBank", type: sql.NVarChar, is_identity: false, is_primary: false },
    ib_bank_code: { name: "IbBankCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    ib_bank_name: { name: "IbBankName", type: sql.NVarChar, is_identity: false, is_primary: false },
    qr_code: { name: "QrCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    qr_expire: { name: "QrExpire", type: sql.DateTime, is_identity: false, is_primary: false },
    qr_expire_time_seconds: { name: "QrExpireTimeSeconds", type: sql.Int, is_identity: false, is_primary: false },
    ref_1: { name: "Ref_1", type: sql.NVarChar, is_identity: false, is_primary: false },
    ref_2: { name: "Ref_2", type: sql.NVarChar, is_identity: false, is_primary: false },
    ref_3: { name: "Ref_3", type: sql.NVarChar, is_identity: false, is_primary: false },
    ref_4: { name: "Ref_4", type: sql.NVarChar, is_identity: false, is_primary: false },
    ref_5: { name: "Ref_5", type: sql.NVarChar, is_identity: false, is_primary: false },
    developer_code: { name: "DeveloperCode", type: sql.NVarChar, is_identity: false, is_primary: true },
    payment_status: { name: "PaymentStatus", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","order_id","txn_id","reference_id","channel_payment","product_payment","client_id","callback_url","redirect_url","payment_method","service_id","customer_id","amount","amount_net","amount_cust_fee","currency","merchant_id","secret_key","term_id","term_name","description","txn_token","card_ref","card_no","card_type","card_expire","card_bank","ib_bank_code","ib_bank_name","qr_code","qr_expire","qr_expire_time_seconds","ref_1","ref_2","ref_3","ref_4","ref_5","developer_code","payment_status","create_date","update_date"]
  );

  constructor(request?: Request | ITransaction_Payment, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ITransaction_Payment);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Transaction_Payment.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ITransaction_Payment): void {
    this.id = data.id;
    this.order_id = data.order_id;
    this.txn_id = data.txn_id;
    this.reference_id = data.reference_id;
    this.channel_payment = data.channel_payment;
    this.product_payment = data.product_payment;
    this.client_id = data.client_id;
    this.callback_url = data.callback_url;
    this.redirect_url = data.redirect_url;
    this.payment_method = data.payment_method;
    this.service_id = data.service_id;
    this.customer_id = data.customer_id;
    this.amount = data.amount;
    this.amount_net = data.amount_net;
    this.amount_cust_fee = data.amount_cust_fee;
    this.currency = data.currency;
    this.merchant_id = data.merchant_id;
    this.secret_key = data.secret_key;
    this.term_id = data.term_id;
    this.term_name = data.term_name;
    this.description = data.description;
    this.txn_token = data.txn_token;
    this.card_ref = data.card_ref;
    this.card_no = data.card_no;
    this.card_type = data.card_type;
    this.card_expire = data.card_expire;
    this.card_bank = data.card_bank;
    this.ib_bank_code = data.ib_bank_code;
    this.ib_bank_name = data.ib_bank_name;
    this.qr_code = data.qr_code;
    this.qr_expire = data.qr_expire;
    this.qr_expire_time_seconds = data.qr_expire_time_seconds;
    this.ref_1 = data.ref_1;
    this.ref_2 = data.ref_2;
    this.ref_3 = data.ref_3;
    this.ref_4 = data.ref_4;
    this.ref_5 = data.ref_5;
    this.developer_code = data.developer_code;
    this.payment_status = data.payment_status;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Transaction_Payment.insert(request, {
      id: this.id,
      order_id: this.order_id,
      txn_id: this.txn_id,
      reference_id: this.reference_id,
      channel_payment: this.channel_payment,
      product_payment: this.product_payment,
      client_id: this.client_id,
      callback_url: this.callback_url,
      redirect_url: this.redirect_url,
      payment_method: this.payment_method,
      service_id: this.service_id,
      customer_id: this.customer_id,
      amount: this.amount,
      amount_net: this.amount_net,
      amount_cust_fee: this.amount_cust_fee,
      currency: this.currency,
      merchant_id: this.merchant_id,
      secret_key: this.secret_key,
      term_id: this.term_id,
      term_name: this.term_name,
      description: this.description,
      txn_token: this.txn_token,
      card_ref: this.card_ref,
      card_no: this.card_no,
      card_type: this.card_type,
      card_expire: this.card_expire,
      card_bank: this.card_bank,
      ib_bank_code: this.ib_bank_code,
      ib_bank_name: this.ib_bank_name,
      qr_code: this.qr_code,
      qr_expire: this.qr_expire,
      qr_expire_time_seconds: this.qr_expire_time_seconds,
      ref_1: this.ref_1,
      ref_2: this.ref_2,
      ref_3: this.ref_3,
      ref_4: this.ref_4,
      ref_5: this.ref_5,
      developer_code: this.developer_code,
      payment_status: this.payment_status,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Transaction_Payment.update(request, {
      id: this.id,
      order_id: this.order_id,
      txn_id: this.txn_id,
      reference_id: this.reference_id,
      channel_payment: this.channel_payment,
      product_payment: this.product_payment,
      client_id: this.client_id,
      callback_url: this.callback_url,
      redirect_url: this.redirect_url,
      payment_method: this.payment_method,
      service_id: this.service_id,
      customer_id: this.customer_id,
      amount: this.amount,
      amount_net: this.amount_net,
      amount_cust_fee: this.amount_cust_fee,
      currency: this.currency,
      merchant_id: this.merchant_id,
      secret_key: this.secret_key,
      term_id: this.term_id,
      term_name: this.term_name,
      description: this.description,
      txn_token: this.txn_token,
      card_ref: this.card_ref,
      card_no: this.card_no,
      card_type: this.card_type,
      card_expire: this.card_expire,
      card_bank: this.card_bank,
      ib_bank_code: this.ib_bank_code,
      ib_bank_name: this.ib_bank_name,
      qr_code: this.qr_code,
      qr_expire: this.qr_expire,
      qr_expire_time_seconds: this.qr_expire_time_seconds,
      ref_1: this.ref_1,
      ref_2: this.ref_2,
      ref_3: this.ref_3,
      ref_4: this.ref_4,
      ref_5: this.ref_5,
      developer_code: this.developer_code,
      payment_status: this.payment_status,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Transaction_Payment.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ITransaction_Payment): Promise<Transaction_Payment[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Transaction_Payment(item));
  }

  static async findOne(request: Request, condition: ITransaction_Payment): Promise<Transaction_Payment> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any: new Transaction_Payment(item);
  }

  static async count(request: Request, condition: ITransaction_Payment): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ITransaction_Payment): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ITransaction_Payment, condition: ITransaction_Payment): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ITransaction_Payment): Promise<void> {
      return this.builder.delete(request, condition);
  }
}