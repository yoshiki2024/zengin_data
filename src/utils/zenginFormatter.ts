import { HeaderRecord, TransferItem, TransferSummary, ValidationError } from '../types/zengin';
import { normalizeZenginString, padLeft, padRight, isValidZenginChars } from './kanaUtils';
import Encoding from 'encoding-japanese';

export interface FormattedRecordDetail {
  lineType: 'header' | 'data' | 'trailer' | 'end';
  lineNumber: number;
  rawText: string;
  byteLength: number;
  itemRef?: TransferItem;
}

export interface GenerationResult {
  records: FormattedRecordDetail[];
  fullText: string;
  summary: TransferSummary;
  sjisBlob: Blob;
  utf8Blob: Blob;
}

/**
 * ヘッダーレコード（120バイト）の組み立て
 */
export function formatHeaderRecord(header: HeaderRecord): string {
  const dataDivision = '1'; // 1桁
  const typeCode = padLeft(header.typeCode || '21', 2, '0'); // 2桁
  const codeDivision = padRight(header.codeClassification || '0', 1, ' '); // 1桁 (0: JIS)
  const clientCode = padLeft(header.clientCode || '0', 10, '0'); // 10桁
  const clientName = padRight(normalizeZenginString(header.clientName || ''), 40, ' '); // 40桁
  const transferDate = padLeft(header.transferDate.replace(/[^0-9]/g, ''), 4, '0'); // 4桁 (MMDD)
  const bankCode = padLeft(header.bankCode.replace(/[^0-9]/g, ''), 4, '0'); // 4桁
  const bankName = padRight(normalizeZenginString(header.bankName || ''), 15, ' '); // 15桁
  const branchCode = padLeft(header.branchCode.replace(/[^0-9]/g, ''), 3, '0'); // 3桁
  const branchName = padRight(normalizeZenginString(header.branchName || ''), 15, ' '); // 15桁
  const accountType = header.accountType === '2' ? '2' : '1'; // 1桁
  const accountNumber = padLeft(header.accountNumber.replace(/[^0-9]/g, ''), 7, '0'); // 7桁
  const dummy = ' '.repeat(17); // 17桁

  const line = `${dataDivision}${typeCode}${codeDivision}${clientCode}${clientName}${transferDate}${bankCode}${bankName}${branchCode}${branchName}${accountType}${accountNumber}${dummy}`;
  return line;
}

/**
 * データレコード（120バイト）の組み立て
 */
export function formatDataRecord(item: TransferItem): string {
  const dataDivision = '2'; // 1桁
  const bankCode = padLeft(item.bankCode.replace(/[^0-9]/g, ''), 4, '0'); // 4桁
  const bankName = padRight(normalizeZenginString(item.bankName || ''), 15, ' '); // 15桁
  const branchCode = padLeft(item.branchCode.replace(/[^0-9]/g, ''), 3, '0'); // 3桁
  const branchName = padRight(normalizeZenginString(item.branchName || ''), 15, ' '); // 15桁
  const clearingHouseCode = '0000'; // 4桁（マニュアル仕様: 全てゼロ）
  const accountType = item.accountType || '1'; // 1桁
  const accountNumber = padLeft(item.accountNumber.replace(/[^0-9]/g, ''), 7, '0'); // 7桁
  const recipientName = padRight(normalizeZenginString(item.recipientName || ''), 30, ' '); // 30桁
  const amount = padLeft(Math.floor(Math.max(0, item.amount || 0)).toString(), 10, '0'); // 10桁
  const newCode = padRight(item.newCode || '0', 1, '0'); // 1桁 (0: その他)

  let customerOrEdi = '';
  let indicator = ' ';
  if (item.useEdi && item.ediInfo) {
    indicator = 'Y';
    customerOrEdi = padRight(normalizeZenginString(item.ediInfo), 20, ' ');
  } else {
    indicator = ' ';
    const c1 = padRight(normalizeZenginString(item.customerCode1 || ''), 10, ' ');
    const c2 = padRight(normalizeZenginString(item.customerCode2 || ''), 10, ' ');
    customerOrEdi = `${c1}${c2}`;
  }

  const transferDivision = item.transferDivision || '7'; // 1桁 (7: 電信振込)
  const dummy = ' '.repeat(7); // 7桁

  const line = `${dataDivision}${bankCode}${bankName}${branchCode}${branchName}${clearingHouseCode}${accountType}${accountNumber}${recipientName}${amount}${newCode}${customerOrEdi}${transferDivision}${indicator}${dummy}`;
  return line;
}

/**
 * トレーラレコード（120バイト）の組み立て
 */
export function formatTrailerRecord(totalCount: number, totalAmount: number): string {
  const dataDivision = '8'; // 1桁
  const countStr = padLeft(totalCount.toString(), 6, '0'); // 6桁
  const amountStr = padLeft(Math.floor(totalAmount).toString(), 12, '0'); // 12桁
  const dummy = ' '.repeat(101); // 101桁

  return `${dataDivision}${countStr}${amountStr}${dummy}`;
}

/**
 * エンドレコード（120バイト）の組み立て
 */
export function formatEndRecord(): string {
  const dataDivision = '9'; // 1桁
  const dummy = ' '.repeat(119); // 119桁

  return `${dataDivision}${dummy}`;
}

/**
 * 全体バリデーション
 */
export function validateZenginData(header: HeaderRecord, items: TransferItem[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // ヘッダーチェック
  if (!header.clientCode || header.clientCode.trim() === '') {
    errors.push({ field: 'clientCode', message: '委託者コード（依頼人コード）を入力してください。', severity: 'error' });
  } else if (!/^\d+$/.test(header.clientCode)) {
    errors.push({ field: 'clientCode', message: '委託者コードは半角数字で入力してください。', severity: 'error' });
  }

  if (!header.clientName || header.clientName.trim() === '') {
    errors.push({ field: 'clientName', message: '委託者名（会社名・口座名義）を入力してください。', severity: 'error' });
  }

  if (!header.transferDate || !/^\d{4}$/.test(header.transferDate.replace(/[^0-9]/g, ''))) {
    errors.push({ field: 'transferDate', message: '振込指定日（取組日）を月日4桁（例: 1025）で指定してください。', severity: 'error' });
  }

  if (!header.bankCode || !/^\d{4}$/.test(header.bankCode.trim())) {
    errors.push({ field: 'bankCode', message: '仕向銀行番号（金融機関コード4桁）を入力してください。', severity: 'error' });
  }

  if (!header.branchCode || !/^\d{3}$/.test(header.branchCode.trim())) {
    errors.push({ field: 'branchCode', message: '仕向支店番号（支店コード3桁）を入力してください。', severity: 'error' });
  }

  if (!header.accountNumber || !/^\d{1,7}$/.test(header.accountNumber.trim())) {
    errors.push({ field: 'accountNumber', message: '依頼人口座番号（半角数字1〜7桁）を入力してください。', severity: 'error' });
  }

  if (items.length === 0) {
    errors.push({ field: 'items', message: '振込データが1件も登録されていません。', severity: 'error' });
  }

  // 各データレコードチェック
  items.forEach((item, index) => {
    const row = index + 1;

    if (!item.bankCode || !/^\d{4}$/.test(item.bankCode.trim())) {
      errors.push({ itemId: item.id, rowNumber: row, field: 'bankCode', message: `行${row}: 被仕向銀行コードは4桁の数字を入力してください。`, severity: 'error' });
    }

    if (!item.branchCode || !/^\d{3}$/.test(item.branchCode.trim())) {
      errors.push({ itemId: item.id, rowNumber: row, field: 'branchCode', message: `行${row}: 被仕向支店コードは3桁の数字を入力してください。`, severity: 'error' });
    }

    if (!item.accountNumber || !/^\d{1,7}$/.test(item.accountNumber.trim())) {
      errors.push({ itemId: item.id, rowNumber: row, field: 'accountNumber', message: `行${row}: 口座番号は半角数字1〜7桁で入力してください。`, severity: 'error' });
    }

    if (!item.recipientName || item.recipientName.trim() === '') {
      errors.push({ itemId: item.id, rowNumber: row, field: 'recipientName', message: `行${row}: 受取人名を入力してください。`, severity: 'error' });
    } else {
      const norm = normalizeZenginString(item.recipientName);
      const check = isValidZenginChars(norm);
      if (!check.valid) {
        errors.push({ itemId: item.id, rowNumber: row, field: 'recipientName', message: `行${row}: 受取人名に使用できない文字が含まれています (${check.invalidChars.join(', ')})`, severity: 'error' });
      }
      if (norm.length > 30) {
        errors.push({ itemId: item.id, rowNumber: row, field: 'recipientName', message: `行${row}: 受取人名は半角カナ30文字以内で指定してください（現在: ${norm.length}文字）。`, severity: 'warning' });
      }
    }

    if (item.amount === undefined || item.amount === null || isNaN(item.amount) || item.amount <= 0) {
      errors.push({ itemId: item.id, rowNumber: row, field: 'amount', message: `行${row}: 振込金額は1円以上の数値を指定してください。`, severity: 'error' });
    } else if (item.amount > 9999999999) {
      errors.push({ itemId: item.id, rowNumber: row, field: 'amount', message: `行${row}: 振込金額が上限（10桁: 9,999,999,999円）を超えています。`, severity: 'error' });
    }
  });

  return errors;
}

/**
 * 全銀協フォーマット文字列およびShift_JIS/UTF-8 Blobの生成
 */
export function generateZenginFiles(header: HeaderRecord, items: TransferItem[]): GenerationResult {
  const records: FormattedRecordDetail[] = [];
  const lines: string[] = [];

  // 1. ヘッダー
  const headerLine = formatHeaderRecord(header);
  lines.push(headerLine);
  records.push({
    lineType: 'header',
    lineNumber: 1,
    rawText: headerLine,
    byteLength: headerLine.length
  });

  // 2. データレコード
  let totalAmount = 0;
  items.forEach((item, idx) => {
    const dataLine = formatDataRecord(item);
    lines.push(dataLine);
    records.push({
      lineType: 'data',
      lineNumber: idx + 2,
      rawText: dataLine,
      byteLength: dataLine.length,
      itemRef: item
    });
    totalAmount += Math.floor(item.amount || 0);
  });

  // 3. トレーラ
  const trailerLine = formatTrailerRecord(items.length, totalAmount);
  lines.push(trailerLine);
  records.push({
    lineType: 'trailer',
    lineNumber: items.length + 2,
    rawText: trailerLine,
    byteLength: trailerLine.length
  });

  // 4. エンド
  const endLine = formatEndRecord();
  lines.push(endLine);
  records.push({
    lineType: 'end',
    lineNumber: items.length + 3,
    rawText: endLine,
    byteLength: endLine.length
  });

  // CRLF 改行で結合
  const fullText = lines.join('\r\n') + '\r\n';

  // UTF-8 Blob
  const utf8Blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });

  // Shift_JIS エンコード
  // encoding-japanese は Unicode 文字コード配列を受け取り SJIS バイト配列へ変換
  const unicodeArray = Encoding.stringToCode(fullText);
  const sjisArray = Encoding.convert(unicodeArray, {
    to: 'SJIS',
    from: 'UNICODE',
  });
  const sjisUint8 = new Uint8Array(sjisArray);
  const sjisBlob = new Blob([sjisUint8], { type: 'text/plain;charset=shift_jis' });

  const errors = validateZenginData(header, items);

  const summary: TransferSummary = {
    totalCount: items.length,
    totalAmount,
    hasErrors: errors.some(e => e.severity === 'error'),
    errors
  };

  return {
    records,
    fullText,
    summary,
    sjisBlob,
    utf8Blob
  };
}
