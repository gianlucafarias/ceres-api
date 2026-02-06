import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { ErrorRequestHandler, Request, RequestHandler } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { resolve } from 'path';
import { AppModule } from './app.module';

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const hasRequestBody = (req: Request): boolean => {
  const contentLength = req.headers['content-length'];
  if (typeof contentLength === 'string' && contentLength !== '0') return true;
  if (Array.isArray(contentLength) && contentLength.some((len) => len !== '0'))
    return true;
  return typeof req.headers['transfer-encoding'] !== 'undefined';
};

const requireJson: RequestHandler = (req, res, next) => {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH'].includes(method)) return next();
  if (!hasRequestBody(req)) return next();

  if (!req.is(['application/json', 'application/*+json'])) {
    return res.status(415).json({
      message: 'Content-Type must be application/json',
      error: 'Unsupported Media Type',
      statusCode: 415,
    });
  }

  return next();
};

const isBodyParserError = (
  err: unknown,
): err is SyntaxError & { body: string } => {
  if (!(err instanceof SyntaxError)) return false;
  return typeof (err as { body?: unknown }).body !== 'undefined';
};

const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (isBodyParserError(err)) {
    return res.status(400).json({
      message: 'Malformed JSON payload',
      error: 'Bad Request',
      statusCode: 400,
    });
  }
  return next(err);
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.enableShutdownHooks();

  app.enableCors();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  if (process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
  }

  const mediaPodaPath =
    process.env.MEDIA_PODA_PATH ?? resolve(process.cwd(), 'media', 'poda');
  const modifiedCertificatesPath =
    process.env.MODIFIED_CERTIFICATES_PATH ??
    resolve(process.cwd(), 'modified_certificates');

  app.use('/media/poda', express.static(mediaPodaPath));
  app.use('/modified_certificates', express.static(modifiedCertificatesPath));

  const generalLimiter = rateLimit({
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: toNumber(process.env.RATE_LIMIT_MAX, 120),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: 'Too many requests',
      error: 'Too Many Requests',
      statusCode: 429,
    },
  });
  const encuestaLimiter = rateLimit({
    windowMs: toNumber(process.env.RATE_LIMIT_STRICT_WINDOW_MS, 60_000),
    max: toNumber(process.env.RATE_LIMIT_STRICT_MAX, 20),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: 'Too many requests',
      error: 'Too Many Requests',
      statusCode: 429,
    },
  });

  app.use('/api', generalLimiter);
  app.use('/api/v1/encuestas', encuestaLimiter);
  app.use(requireJson);
  app.use(jsonErrorHandler);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: false,
    }),
  );

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
void bootstrap();
