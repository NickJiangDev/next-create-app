import mysql from "mysql2/promise";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { env } from "./env";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      uri: env.databaseUrl(),
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

/** SELECT 查询 */
export async function queryRows<T extends RowDataPacket>(
  sql: string,
  params?: (string | number | boolean | null)[],
): Promise<T[]> {
  const [rows] = await getPool().execute<T[]>(sql, params);
  return rows;
}

/** INSERT / UPDATE / DELETE */
export async function execute(
  sql: string,
  params?: (string | number | boolean | null)[],
): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}
