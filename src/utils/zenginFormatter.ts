import { HeaderRecord, TransferItem, TransferSummary, ValidationError } from '../types/zengin';
import {
  normalizeZenginString,
  normalizeBankOrBranchName,
  padLeftBytes,
  padRightBytes,
  isValidZenginChars,
  getSjisByteLength
} from './kanaUtils';
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
 * ヘッダーレコード（120バイト固定長）の組み立て
 */
export function formatHeaderRecord(header: HeaderRecord): string {
  const dataDivision = '1'; // 1桁 (1バイト)
  const typeCode = padLeftBytes(header.typeCode || '21', 2, '0'); // 2桁
  const codeDivision = padRightBytes(header.codeClassification || '0', 1, ' '); // 1桁 (0: JIS)
  const clientCode = padLeftBytes(header.clientCode || '0', 10, '0'); // 10桁
  const clientName = padRightBytes(normalizeZenginString(header.clientName || ''), 40, ' '); // 40桁 (40バイト)
  const transferDate = padLeftBytes(header.transferDate.replace(/[^0-9]/g, ''), 4, '0'); // 4桁 (MMDD)
  const bankCode = padLeftBytes(header.bankCode.replace(/[^0-9]/g, ''), 4, '0'); // 4桁
  // 銀行名: 漢字が含まれる場合は全銀協仕様に基づき安全に半角カナ化または省略（全桁スペース）
  const bankName = padRightBytes(normalizeBankOrBranchName(header.bankName || ''), 15, ' '); // 15桁 (15バイト)
  const branchCode = padLeftBytes(header.branchCode.replace(/[^0-9]/g, ''), 3, '0'); // 3桁
  // 支店名: 漢字が含まれる場合は全銀協仕様に基づき安全に半角カナ化または省略（全桁スペース）
  const branchName = padRightBytes(normalizeBankOrBranchName(header.branchName || ''), 15, ' '); // 15桁 (15バイト)
  const accountType = header.accountType === '2' ? '2' : '1'; // 1桁
  const accountNumber = padLeftBytes(header.accountNumber.replace(/[^0-9]/g, ''), 7, '0'); // 7桁
  const dummy = ' '.repeat(17); // 17桁 (17バイト)

  const line = `${dataDivision}${typeCode}${codeDivision}${clientCode}${clientName}${transferDate}${bankCode}${bankName}${branchCode}${branchName}${accountType}${accountNumber}${dummy}`;
  
  // Shift_JISで確実に120バイトになるよう安全ガード
  return padRightBytes(line, 120, ' ');
}

/**
 * データレコード（120バイト固定長）の組み立て
 */
export function formatDataRecord(item: TransferItem): string {
  const dataDivision = '2'; // 1桁 (1バイト)
  const bankCode = padLeftBytes(item.bankCode.replace(/[^0-9]/g, ''), 4, '0'); // 4桁
  // 銀行名: 漢字が含まれる場合は全銀協仕様に基づき安全に半角カナ化または省略（全桁スペース）
  const bankName = padRightBytes(normalizeBankOrBranchName(item.bankName || ''), 15, ' '); // 15桁 (15バイト)
  const branchCode = padLeftBytes(item.branchCode.replace(/[^0-9]/g, ''), 3, '0'); // 3桁
  // 支店名: 漢字が含まれる場合は全銀協仕様に基づき安全に半角カナ化または省略（全桁スペース）
  const branchName = padRightBytes(normalizeBankOrBranchName(item.branchName || ''), 15, ' '); // 15桁 (15バイト)
  const clearingHouseCode = '0000'; // 4桁（全銀仕様: 4バイト）
  const accountType = item.accountType || '1'; // 1桁
  const accountNumber = padLeftBytes(item.accountNumber.replace(/[^0-9]/g, ''), 7, '0'); // 7桁
  // 受取人名: 30バイト枠（超過時は安全に切り詰め、不足分は半角スペース）
  const recipientName = padRightBytes(normalizeZenginString(item.recipientName || ''), 30, ' '); // 30桁 (30バイト)
  const amount = padLeftBytes(Math.floor(Math.max(0, item.amount || 0)).toString(), 10, '0'); // 10桁
  const newCode = padRightBytes(item.newCode || '0', 1, '0'); // 1桁

  let customerOrEdi = '';
  let indicator = ' ';
  if (item.useEdi && item.ediInfo) {
    indicator = 'Y';
    customerOrEdi = padRightBytes(normalizeZenginString(item.ediInfo), 20, ' ');
  } else {
    indicator = ' ';
    const c1 = padRightBytes(normalizeZenginString(item.customerCode1 || ''), 10, ' ');
    const c2 = padRightBytes(normalizeZenginString(item.customerCode2 || ''), 10, ' ');
    customerOrEdi = `${c1}${c2}`;
  }

  const transferDivision = item.transferDivision || '7'; // 1桁 (7: 電信振込)
  const dummy = ' '.repeat(7); // 7桁

  const line = `${dataDivision}${bankCode}${bankName}${branchCode}${branchName}${clearingHouseCode}${accountType}${accountNumber}${recipientName}${amount}${newCode}${customerOrEdi}${transferDivision}${indicator}${dummy}`;
  
  // Shift_JISで確実に120バイトになるよう安全ガード
  return padRightBytes(line, 120, ' ');
}

/**
 * トレーラレコード（120バイト固定長）の組み立て
 */
export function formatTrailerRecord(totalCount: number, totalAmount: number): string {
  const dataDivision = '8'; // 1桁
  const countStr = padLeftBytes(totalCount.toString(), 6, '0'); // 6桁
  const amountStr = padLeftBytes(Math.floor(totalAmount).toString(), 12, '0'); // 12桁
  const dummy = ' '.repeat(101); // 101桁

  const line = `${dataDivision}${countStr}${amountStr}${dummy}`;
  return padRightBytes(line, 120, ' ');
}

/**
 * エンドレコード（120バイト固定長）の組み立て
 */
export function formatEndRecord(): string {
  const dataDivision = '9'; // 1桁
  const dummy = ' '.repeat(119); // 119桁

  const line = `${dataDivision}${dummy}`;
  return padRightBytes(line, 120, ' ');
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
  } else {
    const norm = normalizeZenginString(header.clientName);
    const check = isValidZenginChars(norm);
    if (!check.valid) {
      errors.push({ field: 'clientName', message: `委託者名（会社名）に全銀協規定外の文字が含まれています (${check.invalidChars.join(', ')})。半角カナ・英数で入力してください。`, severity: 'error' });
    }
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
        errors.push({
          itemId: item.id,
          rowNumber: row,
          field: 'recipientName',
          message: `行${row}: 受取人名に使用できない文字が含まれています (${check.invalidChars.join(', ')})。漢字は使用できませんので半角カナに変換してください。`,
          severity: 'error'
        });
      }
      if (getSjisByteLength(norm) > 30) {
        errors.push({
          itemId: item.id,
          rowNumber: row,
          field: 'recipientName',
          message: `行${row}: 受取人名は半角カナ30文字（30バイト）以内で指定してください（現在: ${getSjisByteLength(norm)}バイト）。超過分は自動カットされます。`,
          severity: 'warning'
        });
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
    byteLength: getSjisByteLength(headerLine)
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
      byteLength: getSjisByteLength(dataLine),
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
    byteLength: getSjisByteLength(trailerLine)
  });

  // 4. エンド
  const endLine = formatEndRecord();
  lines.push(endLine);
  records.push({
    lineType: 'end',
    lineNumber: items.length + 3,
    rawText: endLine,
    byteLength: getSjisByteLength(endLine)
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
