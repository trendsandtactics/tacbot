import mysql, { Pool } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: Pool | undefined;
}

const poolConfig = {
  host: process.env.DB_HOST || 'srv1740.hstgr.io',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'u546576758_chatbot_his',
  password: process.env.DB_PASSWORD || 'HisOmega@2026',
  database: process.env.DB_NAME || 'u546576758_chatbot_his',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  ssl: {
    rejectUnauthorized: false
  }
};

export const pool: Pool = global.mysqlPool || mysql.createPool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
  global.mysqlPool = pool;
}

type SqlParam = string | number | boolean | null | Date | Buffer;

export async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T> {
  const [results] = await pool.execute(sql, params as SqlParam[]);
  return results as T;
}

export async function testConnection(): Promise<{ success: boolean; message: string; tables?: string[] }> {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SHOW TABLES;');
      const tables = (rows as Record<string, unknown>[]).map((r) => Object.values(r)[0] as string);
      return {
        success: true,
        message: 'Successfully connected to MySQL database',
        tables
      };
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Database connection error'
    };
  }
}

export default pool;
