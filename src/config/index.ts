import sql from "mssql";
export * as HttpStatus from "http-status-codes";
export * as Helper from "../utilities";

export let pool: sql.ConnectionPool;

export async function createPool(config: sql.config) {
  pool = await new sql.ConnectionPool({
    ...config,
    options: {
      encrypt: false,
      rowCollectionOnDone: true,
      useUTC: false,
      enableArithAbort: true,
    },
  }).connect();
}

export function createRequest(trans: sql.Transaction = null) {
  if (trans == null) {
    return pool.request();
  } else {
    return new sql.Request(trans);
  }
}
