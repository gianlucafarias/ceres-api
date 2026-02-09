import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminApiKeyGuard } from '../src/common/guards/admin-api-key.guard';
import { ContactsController } from '../src/modules/contacts/contacts.controller';
import { ContactsService } from '../src/modules/contacts/contacts.service';
import { FeedbackController } from '../src/modules/feedback/feedback.controller';
import { FeedbackService } from '../src/modules/feedback/feedback.service';
import { VisitsController } from '../src/modules/visits/visits.controller';
import { VisitsService } from '../src/modules/visits/visits.service';

describe('HTTP ETag read endpoints (e2e)', () => {
  let app: INestApplication<App>;
  const adminApiKey = 'admin-key-test';

  const contactsService = {
    getLastUserInteractions: jest.fn(),
    getContacts: jest.fn(),
    getContactDetailsById: jest.fn(),
    getContactConversations: jest.fn(),
  };
  const feedbackService = {
    getAll: jest.fn(),
  };
  const visitsService = {
    getVisitasFlujo: jest.fn(),
  };

  beforeEach(async () => {
    contactsService.getLastUserInteractions.mockReset();
    contactsService.getContacts.mockReset();
    contactsService.getContactDetailsById.mockReset();
    contactsService.getContactConversations.mockReset();
    feedbackService.getAll.mockReset();
    visitsService.getVisitasFlujo.mockReset();

    contactsService.getLastUserInteractions.mockResolvedValue([
      { id: 1, phone: '3491000001' },
    ]);
    feedbackService.getAll.mockResolvedValue([{ id: 1, score: 5 }]);
    visitsService.getVisitasFlujo.mockResolvedValue({
      visitasFlujo: [{ id: 1, nombre_flujo: 'inicio', contador: 3 }],
      totalVisitas: 3,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController, FeedbackController, VisitsController],
      providers: [
        AdminApiKeyGuard,
        { provide: ContactsService, useValue: contactsService },
        { provide: FeedbackService, useValue: feedbackService },
        { provide: VisitsService, useValue: visitsService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'ADMIN_API_KEY' ? adminApiKey : undefined,
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidUnknownValues: false,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('responde 304 cuando coincide ETag en endpoints de lectura', async () => {
    const endpoints = [
      '/api/v1/feedback',
      '/api/v1/visitas-flujo',
      '/api/v1/contacts/last-interactions',
    ];

    for (const endpoint of endpoints) {
      const first = await request(app.getHttpServer())
        .get(endpoint)
        .set('x-api-key', adminApiKey)
        .expect(200);

      const etag = first.headers.etag as string | undefined;
      expect(etag).toBeDefined();

      await request(app.getHttpServer())
        .get(endpoint)
        .set('x-api-key', adminApiKey)
        .set('If-None-Match', etag ?? '')
        .expect(304);
    }
  });
});
