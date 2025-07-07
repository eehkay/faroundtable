import { DataForSEOClient, SearchVolumeResult } from './dataforseo';

export interface DebugSearchVolumeResult {
  results: SearchVolumeResult[];
  curlCommand: string;
  rawResponse: any;
  requestData: any;
  endpoint: string;
}

export class DataForSEODebugClient extends DataForSEOClient {
  private lastRawResponse: any = null;
  private lastRequestData: any = null;
  private lastEndpoint: string = '';

  private async requestWithDebug<T>(endpoint: string, data?: any): Promise<T> {
    this.lastEndpoint = endpoint;
    this.lastRequestData = data;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const email = (this as any).email;
      const apiKey = (this as any).apiKey;
      const baseUrl = (this as any).baseUrl;
      const authHeader = `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`;

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify([data]) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      this.lastRawResponse = result;

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }
      
      // Check for API-level errors
      if (result.status_code !== 20000) {
        throw new Error(`DataForSEO API error: ${result.status_message || 'Unknown error'}`);
      }

      // Check if we have tasks and they succeeded
      if (!result.tasks || result.tasks.length === 0) {
        return null as any;
      }

      const task = result.tasks[0];
      
      // Check task status
      if (task.status_code !== 20000) {
        throw new Error(`Task failed: ${task.status_message || 'Unknown error'}`);
      }

      // Return the result data
      if (task.result !== undefined) {
        return task.result as T;
      }
      
      // For some endpoints, data might be at tasks[0].data
      if (task.data !== undefined) {
        return task.data as T;
      }
      
      return null as any;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('DataForSEO API request timeout');
      }
      
      throw error;
    }
  }

  async getSearchVolumeWithDebug(keywords: string[], locationCode: number = 2840): Promise<DebugSearchVolumeResult> {
    // Replace the private request method with our debug version
    const originalRequest = (this as any).request;
    (this as any).request = this.requestWithDebug.bind(this);

    try {
      const results = await this.getSearchVolume(keywords, locationCode);
      
      // Generate cURL command
      const email = (this as any).email;
      const apiKey = (this as any).apiKey;
      const authHeader = `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`;
      const baseUrl = (this as any).baseUrl;
      
      const curlCommand = `curl --location --request POST '${baseUrl}${this.lastEndpoint}' \\
--header 'Authorization: ${authHeader}' \\
--header 'Content-Type: application/json' \\
--data-raw '${JSON.stringify([this.lastRequestData], null, 2)}'`;

      return {
        results,
        curlCommand,
        rawResponse: this.lastRawResponse,
        requestData: this.lastRequestData,
        endpoint: this.lastEndpoint,
      };
    } finally {
      // Restore original request method
      (this as any).request = originalRequest;
    }
  }
}