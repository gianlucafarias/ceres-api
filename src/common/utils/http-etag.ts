import { createHash } from 'crypto';
import { HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

export function applyHttpEtag(
  request: Request,
  response: Response,
  payload: unknown,
): boolean {
  const serialized = JSON.stringify(payload ?? null);
  const etag = `W/"${createHash('sha1').update(serialized).digest('hex')}"`;

  response.setHeader('ETag', etag);
  response.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

  if (matchesIfNoneMatch(request.headers['if-none-match'], etag)) {
    response.status(HttpStatus.NOT_MODIFIED);
    return true;
  }

  return false;
}

function matchesIfNoneMatch(
  ifNoneMatchHeader: string | string[] | undefined,
  currentEtag: string,
): boolean {
  if (!ifNoneMatchHeader) return false;

  const headerValue = Array.isArray(ifNoneMatchHeader)
    ? ifNoneMatchHeader.join(',')
    : ifNoneMatchHeader;

  return headerValue
    .split(',')
    .map((token) => token.trim())
    .some((token) => token === '*' || token === currentEtag);
}
