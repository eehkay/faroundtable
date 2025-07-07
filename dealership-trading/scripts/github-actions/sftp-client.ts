import Client from 'ssh2-sftp-client';
import type { SFTPFile } from './types/import';

interface SFTPConfig {
  host: string;
  username: string;
  password: string;
  port: number;
  path: string;
  retries?: number;
  retryDelay?: number;
}

class SFTPConnectionPool {
  private client: Client | null = null;
  private config: SFTPConfig;
  private connectionAttempts = 0;
  private maxAttempts = 3;

  constructor(config: SFTPConfig) {
    this.config = config;
    this.maxAttempts = config.retries || 3;
  }

  async connect(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    this.client = new Client();
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        console.log(`    Attempting SFTP connection (attempt ${attempt}/${this.maxAttempts})...`);
        
        await this.client.connect({
          host: this.config.host,
          username: this.config.username,
          password: this.config.password,
          port: this.config.port,
          readyTimeout: 30000,
          retries: 1,
          retry_minTimeout: 2000
        });
        
        console.log('    ✅ SFTP connection established');
        this.connectionAttempts = 0;
        return this.client;
      } catch (error) {
        console.error(`    ❌ Connection attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error');
        
        if (attempt < this.maxAttempts) {
          const delay = (this.config.retryDelay || 2000) * attempt;
          console.log(`    Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw new Error(`Failed to connect to SFTP server after ${this.maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    throw new Error('Failed to establish SFTP connection');
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.end();
        console.log('    ✅ SFTP connection closed');
      } catch (error) {
        console.error('    ⚠️  Error closing SFTP connection:', error);
      } finally {
        this.client = null;
      }
    }
  }

  async downloadFile(remotePath: string): Promise<Buffer> {
    const client = await this.connect();
    
    try {
      const data = await client.get(remotePath);
      
      if (Buffer.isBuffer(data)) {
        return data;
      } else if (typeof data === 'string') {
        return Buffer.from(data);
      } else {
        throw new Error('Unexpected data type from SFTP');
      }
    } catch (error) {
      throw new Error(`Failed to download ${remotePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listFiles(remotePath: string): Promise<string[]> {
    const client = await this.connect();
    
    try {
      const files = await client.list(remotePath);
      return files
        .filter(file => file.type === '-' && file.name.endsWith('.csv'))
        .map(file => file.name);
    } catch (error) {
      throw new Error(`Failed to list files in ${remotePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export async function downloadInventoryFiles(): Promise<SFTPFile[]> {
  const config: SFTPConfig = {
    host: process.env.SFTP_HOST!,
    username: process.env.SFTP_USERNAME!,
    password: process.env.SFTP_PASSWORD!,
    port: parseInt(process.env.SFTP_PORT || '22'),
    path: process.env.SFTP_PATH || '/',
    retries: 3,
    retryDelay: 2000
  };

  const pool = new SFTPConnectionPool(config);
  const files: SFTPFile[] = [];

  try {
    // List all CSV files in the directory
    console.log(`    Listing files in ${config.path}...`);
    const filenames = await pool.listFiles(config.path);
    console.log(`    Found ${filenames.length} CSV files`);

    // Filter based on IMPORT_STORES environment variable
    const importStores = process.env.IMPORT_STORES || 'all';
    let filesToDownload = filenames;

    if (importStores !== 'all') {
      const storeCodes = importStores.split(',').map(s => s.trim());
      filesToDownload = filenames.filter(filename => {
        const code = filename.replace('.csv', '');
        return storeCodes.includes(code);
      });
      console.log(`    Filtered to ${filesToDownload.length} files based on IMPORT_STORES`);
    }

    // Download files in parallel with concurrency limit
    const downloadPromises = filesToDownload.map(async (filename) => {
      const remotePath = `${config.path}/${filename}`;
      
      try {
        console.log(`    Downloading ${filename}...`);
        const buffer = await pool.downloadFile(remotePath);
        const content = buffer.toString('utf-8');
        
        return {
          filename,
          content,
          size: buffer.length,
          timestamp: new Date()
        };
      } catch (error) {
        console.error(`    ❌ Failed to download ${filename}:`, error);
        throw error;
      }
    });

    // Process downloads with concurrency limit
    const batchSize = 3;
    for (let i = 0; i < downloadPromises.length; i += batchSize) {
      const batch = downloadPromises.slice(i, i + batchSize);
      const results = await Promise.all(batch);
      files.push(...results);
    }

    console.log(`    ✅ Downloaded ${files.length} files successfully`);
    return files;

  } catch (error) {
    console.error('SFTP download failed:', error);
    throw error;
  } finally {
    await pool.disconnect();
  }
}

// Utility function for testing SFTP connection
export async function testSFTPConnection(): Promise<boolean> {
  const config: SFTPConfig = {
    host: process.env.SFTP_HOST!,
    username: process.env.SFTP_USERNAME!,
    password: process.env.SFTP_PASSWORD!,
    port: parseInt(process.env.SFTP_PORT || '22'),
    path: process.env.SFTP_PATH || '/',
    retries: 1
  };

  const pool = new SFTPConnectionPool(config);

  try {
    await pool.connect();
    const files = await pool.listFiles(config.path);
    console.log(`✅ SFTP connection test successful. Found ${files.length} CSV files.`);
    return true;
  } catch (error) {
    console.error('❌ SFTP connection test failed:', error);
    return false;
  } finally {
    await pool.disconnect();
  }
}