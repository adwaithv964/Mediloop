import Tesseract from 'tesseract.js';

interface OCRResult {
  name?: string;
  expiryDate?: string;
  batchNumber?: string;
  manufacturer?: string;
  rawText: string;
}

export const OCRService = {
  async scanMedicine(imageFile: File): Promise<OCRResult> {
    try {
      const result = await Tesseract.recognize(imageFile, 'eng', {
        logger: (m) => console.log(m),
      });

      const text = result.data.text;
      const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

      return {
        name: extractMedicineName(lines),
        expiryDate: formatExpiryDate(extractExpiryDate(text)),
        batchNumber: extractBatchNumber(text),
        manufacturer: extractManufacturer(lines),
        rawText: text,
      };
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to process image');
    }
  },
};

function extractMedicineName(lines: string[]): string | undefined {
  // Usually the medicine name is in the first few lines
  // Look for capitalized words or branded names
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 50 && /^[A-Z]/.test(line)) {
      return line;
    }
  }
  return lines[0];
}

function extractExpiryDate(text: string): Date | undefined {
  // Common patterns: EXP: MM/YYYY, Exp Date: DD/MM/YYYY, USE BY: MM-YYYY
  const patterns = [
    /exp(?:iry)?(?:\s+date)?[:\s]+(\d{1,2})[\/\-](\d{2,4})/i,
    /use\s+by[:\s]+(\d{1,2})[\/\-](\d{2,4})/i,
    /best\s+before[:\s]+(\d{1,2})[\/\-](\d{2,4})/i,
    /(\d{1,2})[\/\-](\d{2,4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let month = parseInt(match[1]);
      let year = parseInt(match[2]);
      
      // Handle 2-digit years
      if (year < 100) {
        year += 2000;
      }

      if (month >= 1 && month <= 12 && year >= 2020 && year <= 2050) {
        return new Date(year, month - 1, 1);
      }
    }
  }

  return undefined;
}

function extractBatchNumber(text: string): string | undefined {
  const patterns = [
    /batch(?:\s+no\.?)?[:\s]+([A-Z0-9]+)/i,
    /lot(?:\s+no\.?)?[:\s]+([A-Z0-9]+)/i,
    /b\.?no\.?[:\s]+([A-Z0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

function extractManufacturer(lines: string[]): string | undefined {
  // Look for "Mfg by", "Manufactured by", etc.
  for (const line of lines) {
    if (/mfg|manufactured|maker/i.test(line)) {
      return line.replace(/mfg|manufactured|maker/i, '').replace(/[:\-]/g, '').trim();
    }
  }

  return undefined;
}

function formatExpiryDate(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString().split('T')[0];
}
