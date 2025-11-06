import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function initializeDatabase(): Promise<Pool> {
  const client = await pool.connect();
  try {
    // Test connection
    const result = await client.query('SELECT NOW()');
    console.log('Database connection test:', result.rows[0]);

    // Run migrations
    await runMigrations(client);

    return pool;
  } finally {
    client.release();
  }
}

async function runMigrations(client: PoolClient): Promise<void> {
  // Files table
  await client.query(`
    CREATE TABLE IF NOT EXISTS files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_name VARCHAR(255) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(255),
      encrypted_file_key TEXT NOT NULL,
      s3_key TEXT NOT NULL,
      share_link VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT,
      salt TEXT NOT NULL,
      expiration_date TIMESTAMP NOT NULL,
      max_downloads INTEGER,
      download_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      uploader_ip VARCHAR(45),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  // Downloads table
  await client.query(`
    CREATE TABLE IF NOT EXISTS downloads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      downloader_ip VARCHAR(45),
      user_agent TEXT
    )
  `);

  // Create indexes
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_files_share_link ON files(share_link)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_files_expiration_date ON files(expiration_date)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_files_uploader_ip ON files(uploader_ip)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_downloads_file_id ON downloads(file_id)
  `);

  console.log('✓ Database migrations completed');
}

export function getPool(): Pool {
  return pool;
}

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function closePool(): Promise<void> {
  await pool.end();
}
