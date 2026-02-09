import { HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { applyHttpEtag } from './http-etag';

describe('applyHttpEtag', () => {
  it('setea ETag y responde no-modified cuando coincide If-None-Match', () => {
    const request = { headers: {} } as Request;
    const response = createResponseStub();

    const first = applyHttpEtag(request, response.asResponse, { ok: true });
    expect(first).toBe(false);
    expect(response.headers.ETag).toBeDefined();
    expect(response.headers['Cache-Control']).toBe(
      'private, max-age=0, must-revalidate',
    );

    const secondRequest = {
      headers: { 'if-none-match': response.headers.ETag },
    } as Request;
    const second = applyHttpEtag(secondRequest, response.asResponse, {
      ok: true,
    });

    expect(second).toBe(true);
    expect(response.statusCode).toBe(HttpStatus.NOT_MODIFIED);
  });
});

function createResponseStub() {
  const headers: Record<string, string> = {};
  let statusCode = 200;

  const asResponse = {
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    },
    status: (value: number) => {
      statusCode = value;
      return asResponse;
    },
  } as unknown as Response;

  return {
    asResponse,
    headers,
    get statusCode() {
      return statusCode;
    },
  };
}
