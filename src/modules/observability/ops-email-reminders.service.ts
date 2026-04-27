import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClient } from '../../shared/http/http-client.service';
import { EnqueueEmailJobDto } from './dto/enqueue-email-job.dto';
import { OpsEmailQueueService } from './ops-email-queue.service';
import { OpsEventsService } from './ops-events.service';

const REMINDER_SCAN_INTERVAL_MS = 60 * 60 * 1000;
const REMINDER_TYPES = ['verify_account', 'missing_criminal_record'] as const;
const REMINDER_WINDOWS = ['d1', 'd3', 'd7'] as const;
const REMINDER_PAGE_LIMIT = 200;

type ReminderType = (typeof REMINDER_TYPES)[number];
type ReminderWindow = (typeof REMINDER_WINDOWS)[number];

type PendingReminderItem = {
  entityType: string;
  entityId: string;
  email: string;
  templateKey: EnqueueEmailJobDto['templateKey'];
  payload: Record<string, unknown>;
  idempotencyKey: string;
  source: string;
  summary?: string;
};

type PendingRemindersResponse = {
  success: boolean;
  data: PendingReminderItem[];
  pagination?: {
    nextCursor?: string | null;
    limit?: number;
  };
  meta?: {
    requestId?: string;
  };
};

@Injectable()
export class OpsEmailRemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OpsEmailRemindersService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly httpClient: HttpClient,
    private readonly queueService: OpsEmailQueueService,
    private readonly eventsService: OpsEventsService,
  ) {}

  onModuleInit(): void {
    void this.runScanCycle();
    this.timer = setInterval(() => {
      void this.runScanCycle();
    }, REMINDER_SCAN_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async runScanCycle(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      const baseUrl = this.getRemindersBaseUrl();
      const apiKey = this.getRemindersApiKey();

      if (!baseUrl || !apiKey) {
        await this.eventsService.createEvent({
          source: 'ceres-api',
          kind: 'workflow',
          domain: 'ops.email.reminders',
          eventName: 'services.reminders.pending.skipped',
          status: 'skipped',
          summary: 'Reminder scan omitido por configuracion incompleta',
          metadata: {
            reason: 'missing_config',
            hasBaseUrl: Boolean(baseUrl),
            hasApiKey: Boolean(apiKey),
          },
        });
        return;
      }

      for (const type of REMINDER_TYPES) {
        for (const window of REMINDER_WINDOWS) {
          await this.consumeReminderPageSet(baseUrl, apiKey, type, window);
        }
      }
    } catch (error) {
      this.logger.error(`Reminder scan cycle failed: ${String(error)}`);
    } finally {
      this.running = false;
    }
  }

  private async consumeReminderPageSet(
    baseUrl: string,
    apiKey: string,
    type: ReminderType,
    window: ReminderWindow,
  ): Promise<void> {
    let cursor: string | null = null;
    let page = 0;

    do {
      page += 1;
      const response = await this.fetchPendingReminders({
        baseUrl,
        apiKey,
        type,
        window,
        limit: REMINDER_PAGE_LIMIT,
        cursor,
      });

      for (const item of response.data) {
        await this.queueService.enqueue({
          templateKey: item.templateKey,
          recipient: item.email,
          payload: item.payload,
          source: item.source,
          idempotencyKey: item.idempotencyKey,
          entityType: item.entityType,
          entityId: item.entityId,
          metadata: item.summary
            ? {
                summary: item.summary,
                reminderType: type,
                reminderWindow: window,
              }
            : {
                reminderType: type,
                reminderWindow: window,
              },
        });
      }

      cursor = response.pagination?.nextCursor ?? null;

      this.logger.debug(
        `Reminder page processed type=${type} window=${window} page=${page} items=${response.data.length}`,
      );
    } while (cursor);
  }

  private async fetchPendingReminders(input: {
    baseUrl: string;
    apiKey: string;
    type: ReminderType;
    window: ReminderWindow;
    limit: number;
    cursor: string | null;
  }): Promise<PendingRemindersResponse> {
    try {
      const response = await this.httpClient.get<PendingRemindersResponse>(
        `${input.baseUrl}/api/v1/ops/reminders/pending`,
        {
          headers: {
            'x-api-key': input.apiKey,
          },
          params: {
            type: input.type,
            window: input.window,
            limit: input.limit,
            ...(input.cursor ? { cursor: input.cursor } : {}),
          },
          timeout: 10000,
        },
      );

      if (!response.success || !Array.isArray(response.data)) {
        throw new Error('Respuesta invalida de reminders pending');
      }

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.eventsService.createEvent({
        source: 'ceres-api',
        kind: 'workflow',
        domain: 'ops.email.reminders',
        eventName: 'services.reminders.pending.failed',
        status: 'failure',
        summary: `Fallo consumo de pendientes ${input.type}/${input.window}`,
        metadata: {
          reminderType: input.type,
          reminderWindow: input.window,
          error: message,
        },
      });
      throw error;
    }
  }

  private getRemindersBaseUrl(): string {
    const value = this.config.get<string>('SERVICES_PLATFORM_BASE_URL', '');
    return value.trim().replace(/\/+$/, '');
  }

  private getRemindersApiKey(): string {
    return this.config.get<string>('OPS_API_KEY', '').trim();
  }
}
