import axios from 'axios';
import { Injectable } from '@nestjs/common';

export interface HttpRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
}

@Injectable()
export class HttpClient {
  private readonly client = axios.create({});

  async get<TResponse>(url: string, config?: HttpRequestConfig): Promise<TResponse> {
    const response = await this.client.get<TResponse>(url, config);
    return response.data;
  }

  async post<TResponse, TBody = unknown>(url: string, body?: TBody, config?: HttpRequestConfig): Promise<TResponse> {
    const response = await this.client.post<TResponse>(url, body, config);
    return response.data;
  }

  async head(url: string, config?: HttpRequestConfig): Promise<number> {
    const response = await this.client.head(url, config);
    return response.status;
  }
}
