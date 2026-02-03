import { IsInt } from 'class-validator';

export class FeedbackQueryDto {
  // Placeholder for future filters; kept to mirror legacy simple GET all
  @IsInt({ each: false })
  dummy?: number;
}
