import {
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';

export class CreateQrTrackingDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'targetUrl debe comenzar con http:// o https://' },
  )
  targetUrl!: string;
}

export class QrTrackingQueryDto {
  @IsOptional()
  @IsString()
  ids?: string;
}

export class QrTrackingIdParamDto {
  @IsUUID()
  id!: string;
}

export class QrTrackingSlugParamDto {
  @IsString()
  @Length(1, 160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, {
    message: 'slug invalido',
  })
  slug!: string;
}
