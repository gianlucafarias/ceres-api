import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create();
  }

  async get<TResponse>(url: string, config?: AxiosRequestConfig): Promise<TResponse> {
    const response = await this.client.get<TResponse>(url, config);
    return response.data;
  }

  async post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await this.client.post<TResponse>(url, body, config);
    return response.data;
  }

  async head(url: string, config?: AxiosRequestConfig): Promise<number> {
    const response = await this.client.head(url, config);
    return response.status;
  }
}
