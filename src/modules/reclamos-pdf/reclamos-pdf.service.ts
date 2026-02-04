import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Repository } from 'typeorm';
import { Reclamo } from '../../entities/reclamo.entity';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';

@Injectable()
export class ReclamosPdfService {
  constructor(
    @InjectRepository(Reclamo)
    private readonly reclamoRepo: Repository<Reclamo>,
    @InjectRepository(ReclamoHistorial)
    private readonly historialRepo: Repository<ReclamoHistorial>,
  ) {}

  async generatePdfBuffer(reclamoId: number): Promise<Buffer> {
    const reclamo = await this.reclamoRepo.findOne({ where: { id: reclamoId } });
    if (!reclamo) {
      throw new NotFoundException('Reclamo no encontrado');
    }

    const historial = await this.historialRepo.find({
      where: { reclamoId },
      order: { fecha: 'DESC' },
    });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const primaryColor = rgb(0.2, 0.4, 0.8);
    const secondaryColor = rgb(0.4, 0.4, 0.4);
    const borderColor = rgb(0.8, 0.8, 0.8);

    const titleSize = 24;
    const subtitleSize = 16;
    const normalSize = 12;
    const smallSize = 10;
    const lineHeight = 20;
    const sectionSpacing = 30;
    const margin = 50;
    let y = height - margin;

    type DrawTextOptions = Omit<NonNullable<Parameters<PDFPage['drawText']>[1]>, 'font' | 'size' | 'color'> & {
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
    };

    const getCenteredX = (text: string, fontSize: number, textFont: PDFFont) => {
      const textWidth = textFont.widthOfTextAtSize(text, fontSize);
      return (width - textWidth) / 2;
    };

    const wrapText = (text: string, maxWidth: number, fontSize: number, textFont: PDFFont): string[] => {
      const cleanedText = this.cleanText(text);
      const words = cleanedText.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = textFont.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) lines.push(currentLine);
      return lines.length > 0 ? lines : [''];
    };

    const addText = (text: string, x: number, yPos: number, options: DrawTextOptions = {}) => {
      const cleanedText = this.cleanText(text);
      const { size, bold, color, ...rest } = options;
      page.drawText(cleanedText, {
        x,
        y: yPos,
        size: size ?? normalSize,
        font: bold ? boldFont : font,
        color: color ?? secondaryColor,
        ...rest,
      });
    };

    const drawSection = (title: string, content: string[], startY: number) => {
      addText(title, margin, startY, { size: subtitleSize, bold: true, color: primaryColor });
      startY -= lineHeight * 1.5;

      const maxContentWidth = width - margin - (margin + 20);

      content.forEach((item) => {
        if (item) {
          const linesOfItem = item.split('\n');
          linesOfItem.forEach((singleLine) => {
            if (singleLine) {
              const wrappedLines = wrapText(singleLine, maxContentWidth, normalSize, font);
              wrappedLines.forEach((wrappedLine) => {
                addText(wrappedLine, margin + 20, startY);
                startY -= lineHeight;
              });
            }
          });
        }
      });

      startY -= 10;
      page.drawLine({
        start: { x: margin, y: startY },
        end: { x: width - margin, y: startY },
        thickness: 1,
        color: borderColor,
      });

      return startY - 20;
    };

    const title = 'Gobierno de la Ciudad de Ceres';
    addText(title, getCenteredX(title, titleSize, boldFont), y, {
      size: titleSize,
      bold: true,
      color: primaryColor,
    });
    y -= lineHeight * 2;

    const subtitle = 'Gestión de Reclamos';
    addText(subtitle, getCenteredX(subtitle, subtitleSize, font), y, {
      size: subtitleSize,
      color: secondaryColor,
    });
    y -= lineHeight * 2;

    const reclamoTitle = `Reclamo #${reclamo.id}`;
    addText(reclamoTitle, getCenteredX(reclamoTitle, subtitleSize, boldFont), y, {
      size: subtitleSize,
      bold: true,
    });
    y -= lineHeight;

    const fechaGeneracion = `Comprobante generado el ${format(
      new Date(),
      "d 'de' MMMM 'de' yyyy 'a las' HH:mm",
      { locale: es },
    )}`;
    addText(fechaGeneracion, getCenteredX(fechaGeneracion, smallSize, font), y, {
      size: smallSize,
      color: secondaryColor,
    });
    y -= sectionSpacing;

    y = drawSection(
      'Información General',
      [
        `Fecha de creación: ${format(reclamo.fecha, "d 'de' MMMM 'de' yyyy", { locale: es })}`,
        `Estado: ${reclamo.estado}`,
        `Categoría: ${reclamo.reclamo}`,
      ],
      y,
    );

    const detalleLines = reclamo.detalle.split('\n');
    y = drawSection('Descripción del Problema', detalleLines, y);

    y = drawSection(
      'Ubicación',
      [`Dirección: ${reclamo.ubicacion}`, `Barrio: ${reclamo.barrio}`],
      y,
    );

    y = drawSection(
      'Datos del Solicitante',
      [`Nombre: ${reclamo.nombre}`, `Teléfono: ${reclamo.telefono}`],
      y,
    );

    const historialFiltrado = historial.filter((item) => item.tipo === 'ESTADO');
    if (historialFiltrado.length > 0) {
      const historialContent = historialFiltrado.map((item) => {
        const fechaFormateada = format(item.fecha, 'd/MM/yyyy HH:mm', { locale: es });
        const lines = [`${fechaFormateada} - ${item.tipo}`];
        if (item.valorAnterior && item.valorNuevo && item.valorAnterior !== item.valorNuevo) {
          lines.push(`De: ${item.valorAnterior}`);
          lines.push(`A: ${item.valorNuevo}`);
        } else if (item.valorAnterior) {
          lines.push(`De: ${item.valorAnterior}`);
        } else if (item.valorNuevo) {
          lines.push(`A: ${item.valorNuevo}`);
        }
        return lines.join('\n');
      });
      y = drawSection('Historial de Cambios', historialContent, y);
    }

    const footerText1 = 'Este documento es un comprobante de reclamo generado por Ceresito.';
    addText(footerText1, getCenteredX(footerText1, smallSize, font), 50, {
      size: smallSize,
      color: secondaryColor,
    });
    const footerText2 = 'Gobierno de la Ciudad de Ceres';
    addText(footerText2, getCenteredX(footerText2, smallSize, font), 30, {
      size: smallSize,
      color: secondaryColor,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private cleanText(text: string): string {
    if (typeof text !== 'string') return '';
    return text
      .split('')
      .map((char) => {
        const code = char.charCodeAt(0);
        if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) return char;
        if (code === 10 || code === 13) return '\n';
        if (code === 9) return ' ';
        return '';
      })
      .join('')
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }
}
