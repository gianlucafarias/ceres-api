import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { HttpClient } from '../../shared/http/http-client.service';
import { OpsEmailQueueService } from './ops-email-queue.service';
import { OpsEmailRemindersService } from './ops-email-reminders.service';
import { OpsEventsService } from './ops-events.service';

describe('OpsEmailRemindersService', () => {
  let service: OpsEmailRemindersService;
  let httpClient: {
    get: jest.MockedFunction<
      <TResponse>(
        url: string,
        config?: {
          headers?: Record<string, string>;
          params?: Record<string, unknown>;
          timeout?: number;
        },
      ) => Promise<TResponse>
    >;
  };
  let queueService: {
    enqueue: jest.MockedFunction<
      (dto: {
        templateKey:
          | 'services.email_verification'
          | 'services.professional_approved'
          | 'services.password_reset'
          | 'services.verification_resend'
          | 'services.reminder_verify_account'
          | 'services.reminder_missing_criminal_record';
        recipient: string;
        source: string;
        payload: Record<string, unknown>;
        idempotencyKey: string;
        requestId?: string;
        entityType?: string;
        entityId?: string;
        metadata?: Record<string, unknown>;
        providerStrategy?:
          | 'resend-first'
          | 'smtp-first'
          | 'resend-only'
          | 'smtp-only';
      }) => Promise<unknown>
    >;
  };
  let eventsService: {
    createEvent: jest.MockedFunction<
      (input: Record<string, unknown>) => Promise<unknown>
    >;
  };
  let configValues: Record<string, string>;

  beforeEach(async () => {
    configValues = {
      SERVICES_PLATFORM_BASE_URL: 'https://plataforma.ceres.gob.ar',
      OPS_API_KEY: 'ops-key',
    };

    httpClient = {
      get: jest.fn(),
    };
    queueService = {
      enqueue: jest.fn().mockResolvedValue({ accepted: true }),
    };
    eventsService = {
      createEvent: jest.fn().mockResolvedValue({ success: true }),
    };

    const module = await Test.createTestingModule({
      providers: [
        OpsEmailRemindersService,
        { provide: HttpClient, useValue: httpClient },
        { provide: OpsEmailQueueService, useValue: queueService },
        { provide: OpsEventsService, useValue: eventsService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) =>
              configValues[key] ?? fallback,
          },
        },
      ],
    }).compile();

    service = module.get(OpsEmailRemindersService);
  });

  it('encola items paginados de reminders pending', async () => {
    const firstPage = {
      success: true,
      data: [
        {
          entityType: 'user',
          entityId: 'usr-1',
          email: 'user1@test.com',
          templateKey: 'services.reminder_verify_account',
          payload: { verificationUrl: 'https://x/auth/verify' },
          idempotencyKey: 'reminder.verify_email:usr-1:d1',
          source: 'plataforma-servicios-ceres',
          summary: 'summary-1',
        },
      ],
      pagination: {
        nextCursor: 'cursor-1',
        limit: 200,
      },
    };
    const secondPage = {
      success: true,
      data: [
        {
          entityType: 'user',
          entityId: 'usr-2',
          email: 'user2@test.com',
          templateKey: 'services.reminder_verify_account',
          payload: { verificationUrl: 'https://x/auth/verify' },
          idempotencyKey: 'reminder.verify_email:usr-2:d1',
          source: 'plataforma-servicios-ceres',
          summary: 'summary-2',
        },
      ],
      pagination: {
        nextCursor: null,
        limit: 200,
      },
    };

    httpClient.get
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValue(secondPage);

    await (
      service as unknown as { runScanCycle: () => Promise<void> }
    ).runScanCycle();

    expect(httpClient.get).toHaveBeenCalled();
    expect(queueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: 'services.reminder_verify_account',
        recipient: 'user1@test.com',
        idempotencyKey: 'reminder.verify_email:usr-1:d1',
        entityType: 'user',
        entityId: 'usr-1',
      }),
    );
    expect(queueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: 'services.reminder_verify_account',
        recipient: 'user2@test.com',
        idempotencyKey: 'reminder.verify_email:usr-2:d1',
        entityType: 'user',
        entityId: 'usr-2',
      }),
    );
  });

  it('registra skipped cuando falta configuracion minima', async () => {
    configValues.SERVICES_PLATFORM_BASE_URL = '';

    await (
      service as unknown as { runScanCycle: () => Promise<void> }
    ).runScanCycle();

    expect(eventsService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'services.reminders.pending.skipped',
        status: 'skipped',
      }),
    );
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('registra failed cuando falla consumo remoto', async () => {
    httpClient.get.mockRejectedValue(new Error('remote 500'));

    await (
      service as unknown as { runScanCycle: () => Promise<void> }
    ).runScanCycle();

    expect(eventsService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'services.reminders.pending.failed',
        status: 'failure',
      }),
    );
  });
});
