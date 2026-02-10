import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { CrearCertificadoDto } from './dto/certificados.dto';

@Injectable()
export class CertificadosService {
  constructor(private readonly config: ConfigService) {}

  async crear(dto: CrearCertificadoDto): Promise<string> {
    const documentNumber = normalizeDocumentNumber(dto.documentNumber);
    if (!documentNumber) {
      throw new BadRequestException('documentNumber invalido');
    }

    const participantName = normalizeParticipantName(dto.name);
    if (!participantName) {
      throw new BadRequestException('name invalido');
    }

    const outputDir = this.getOutputDirectory();
    const fileName = `certificado-${documentNumber}.pdf`;
    const absolutePath = join(outputDir, fileName);
    const relativePublicPath = `/modified_certificates/${fileName}`;

    await mkdir(outputDir, { recursive: true });
    const pdfBytes = await this.buildCertificatePdf(
      participantName,
      documentNumber,
    );
    await writeFile(absolutePath, pdfBytes);

    return relativePublicPath;
  }

  private getOutputDirectory(): string {
    return this.config.get<string>(
      'MODIFIED_CERTIFICATES_PATH',
      resolve(process.cwd(), 'modified_certificates'),
    );
  }

  private async buildCertificatePdf(
    participantName: string,
    documentNumber: string,
  ): Promise<Uint8Array<ArrayBufferLike>> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const title = 'CERTIFICADO DE PARTICIPACION';
    const subtitle = 'Gobierno de la Ciudad de Ceres';
    const messageLine1 = 'Se certifica que';
    const messageLine2 = `Documento: ${documentNumber}`;
    const messageLine3 =
      'participo de las actividades oficiales del municipio.';
    const dateLabel = `Emitido: ${new Date().toISOString().slice(0, 10)}`;

    page.drawRectangle({
      x: 25,
      y: 25,
      width: 792,
      height: 545,
      borderColor: rgb(0.1, 0.3, 0.55),
      borderWidth: 3,
    });

    page.drawText(title, {
      x: centeredX(title, titleFont, 28, page.getWidth()),
      y: 500,
      size: 28,
      font: titleFont,
      color: rgb(0.1, 0.2, 0.4),
    });

    page.drawText(subtitle, {
      x: centeredX(subtitle, bodyFont, 16, page.getWidth()),
      y: 468,
      size: 16,
      font: bodyFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(messageLine1, {
      x: centeredX(messageLine1, bodyFont, 20, page.getWidth()),
      y: 370,
      size: 20,
      font: bodyFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(participantName, {
      x: centeredX(participantName, titleFont, 36, page.getWidth()),
      y: 320,
      size: 36,
      font: titleFont,
      color: rgb(0.05, 0.25, 0.45),
    });

    page.drawText(messageLine2, {
      x: centeredX(messageLine2, bodyFont, 18, page.getWidth()),
      y: 268,
      size: 18,
      font: bodyFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(messageLine3, {
      x: centeredX(messageLine3, bodyFont, 16, page.getWidth()),
      y: 228,
      size: 16,
      font: bodyFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(dateLabel, {
      x: centeredX(dateLabel, bodyFont, 14, page.getWidth()),
      y: 120,
      size: 14,
      font: bodyFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    return pdfDoc.save();
  }
}

function normalizeDocumentNumber(value: string): string {
  return (value || '').replace(/\D+/g, '');
}

function normalizeParticipantName(value: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';

  return trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

function centeredX(
  text: string,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  size: number,
  pageWidth: number,
): number {
  const textWidth = font.widthOfTextAtSize(text, size);
  return (pageWidth - textWidth) / 2;
}
