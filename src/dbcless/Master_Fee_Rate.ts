import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_Fee_RateMethod {
  load(request: Request, id: number | IMaster_Fee_Rate): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Fee_Rate): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Fee_Rate {
    id?: number;
    service_id?: string;
}

export class Master_Fee_Rate implements IMaster_Fee_Rate, IMaster_Fee_RateMethod {
    id?: number;
    service_id?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Fee_Rate",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    service_id: { name: "ServiceId", type: sql.NVarChar, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","service_id"]
  );

  constructor(request?: Request | IMaster_Fee_Rate, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Fee_Rate);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Fee_Rate.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Fee_Rate): void {
    this.id = data.id;
    this.service_id = data.service_id;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Fee_Rate.insert(request, {
      id: this.id,
      service_id: this.service_id,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Fee_Rate.update(request, {
      id: this.id,
      service_id: this.service_id,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Fee_Rate.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Fee_Rate): Promise<Master_Fee_Rate[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Fee_Rate(item));
  }

  static async findOne(request: Request, condition: IMaster_Fee_Rate): Promise<Master_Fee_Rate> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Fee_Rate(item);
  }

  static async count(request: Request, condition: IMaster_Fee_Rate): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Fee_Rate): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Fee_Rate, condition: IMaster_Fee_Rate): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Fee_Rate): Promise<void> {
      return this.builder.delete(request, condition);
  }
}