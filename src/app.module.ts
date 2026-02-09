import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { entities } from './entities';
import { HealthModule } from './health/health.module';
import { RedisModule } from './shared/redis/redis.module';
import { HttpModule } from './shared/http/http.module';
import { UsersModule } from './modules/users/users.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { HistoryModule } from './modules/history/history.module';
import { ActivityModule } from './modules/activity/activity.module';
import { VisitsModule } from './modules/visits/visits.module';
import { ReclamosModule } from './modules/reclamos/reclamos.module';
import { ReclamosPdfModule } from './modules/reclamos-pdf/reclamos-pdf.module';
import { EncuestasModule } from './modules/encuestas/encuestas.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { ImpuestosModule } from './modules/impuestos/impuestos.module';
import { AmeliaModule } from './modules/amelia/amelia.module';
import { FarmaciasModule } from './modules/farmacias/farmacias.module';
import { BotConfigModule } from './modules/bot-config/bot-config.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ConversacionesModule } from './modules/conversaciones/conversaciones.module';
import { DashboardCeresitoModule } from './modules/dashboard-ceresito/dashboard-ceresito.module';
import { AdminBootstrapModule } from './modules/admin-bootstrap/admin-bootstrap.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USERNAME', ''),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', ''),
        synchronize: false,
        logging: config.get<string>('NODE_ENV') !== 'production',
        entities,
      }),
    }),
    HttpModule,
    RedisModule,
    HealthModule,
    UsersModule,
    InteractionsModule,
    ContactsModule,
    HistoryModule,
    ActivityModule,
    VisitsModule,
    ReclamosModule,
    ReclamosPdfModule,
    EncuestasModule,
    NotificacionesModule,
    ImpuestosModule,
    AmeliaModule,
    FarmaciasModule,
    BotConfigModule,
    FeedbackModule,
    ConversacionesModule,
    DashboardCeresitoModule,
    AdminBootstrapModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
