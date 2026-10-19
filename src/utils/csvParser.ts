import Papa from 'papaparse';
import Encoding from 'encoding-japanese';
import { TransferItem, HeaderRecord, AccountType } from '../types/zengin';
import { normalizeZenginString } from './kanaUtils';

export interface CsvColumnMapping {
  bankCodeCol: number | string;
  bankNameCol: number | string;
  branchCodeCol: number | string;
  branchNameCol: number | string;
  accountTypeCol: number | string;
  accountNumberCol: number | string;
  recipientNameCol: number | string;
  amountCol: number | string;
  customerCode1Col?: number | string;
  customerCode2Col?: number | string;
  ediInfoCol?: number | string;
}

export interface ParsedCsvData {
  headers: string[];
  rawRows: string[][];
  guessedMapping: CsvColumnMapping;
  isZenginCsvFormat: boolean;
  zenginHeaderInfo?: Partial<HeaderRecord>;
  detectedEncoding: string;
}

/**
 * ファイルを読み取り、Shift_JISまたはUTF-8を自動判別して文字列に変換
 */
export async function readCsvFileWithAutoEncoding(file: File): Promise<{ text: string; encoding: string }> {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  // エンコーディング自動検出
  const detected = Encoding.detect(uint8Array) || 'UTF8';
  let encodingName = 'UTF-8';

  let text: string;
  if (detected === 'SJIS') {
    encodingName = 'Shift_JIS';
    const unicodeArray = Encoding.convert(uint8Array, {
      to: 'UNICODE',
      from: 'SJIS'
    });
    text = Encoding.codeToString(unicodeArray);
  } else if (detected === 'EUCJP') {
    encodingName = 'EUC-JP';
    const unicodeArray = Encoding.convert(uint8Array, {
      to: 'UNICODE',
      from: 'EUCJP'
    });
    text = Encoding.codeToString(unicodeArray);
  } else {
    // デフォルトUTF-8デコード
    const decoder = new TextDecoder('utf-8');
    text = decoder.decode(uint8Array);
  }

  return { text, encoding: encodingName };
}

/**
 * CSVテキストをパースし、ヘッダー・列構造を解析
 */
export function parseCsvContent(csvText: string): ParsedCsvData {
  const parsed = Papa.parse<string[]>(csvText.trim(), {
    skipEmptyLines: 'greedy',
  });

  const rawRows = parsed.data;
  if (!rawRows || rawRows.length === 0) {
    throw new Error('CSVファイルが空か、読み取り可能なデータがありません。');
  }

  // 全銀CSV形式（1行目が1,21... で始まる）かチェック
  const firstRow = rawRows[0];
  const isZenginCsvFormat = firstRow && (firstRow[0] === '1' || firstRow[0] === '１') && (firstRow[1] === '21' || firstRow[1] === '11' || firstRow[1] === '12');

  let zenginHeaderInfo: Partial<HeaderRecord> | undefined;
  if (isZenginCsvFormat) {
    zenginHeaderInfo = {
      typeCode: (firstRow[1] === '11' ? '11' : firstRow[1] === '12' ? '12' : '21'),
      codeClassification: firstRow[2] || '0',
      clientCode: firstRow[3] || '',
      clientName: firstRow[4] || '',
      transferDate: firstRow[5] || '',
      bankCode: firstRow[6] || '',
      bankName: firstRow[7] || '',
      branchCode: firstRow[8] || '',
      branchName: firstRow[9] || '',
      accountType: firstRow[10] === '2' ? '2' : '1',
      accountNumber: firstRow[11] || '',
    };
  }

  // 1行目がヘッダー（文字列見出し）かどうかを判定
  const hasTextHeader = !isZenginCsvFormat && isHeaderRow(firstRow);
  const headers = hasTextHeader 
    ? firstRow.map((col, idx) => col.trim() || `列 ${idx + 1}`)
    : firstRow.map((_, idx) => `列 ${idx + 1}`);

  const guessedMapping = guessColumnMapping(headers, rawRows);

  return {
    headers,
    rawRows,
    guessedMapping,
    isZenginCsvFormat,
    zenginHeaderInfo,
    detectedEncoding: 'AUTO'
  };
}

/**
 * ヘッダー行かどうかの簡易推測
 */
function isHeaderRow(row: string[]): boolean {
  if (!row || row.length === 0) return false;
  // 数字のみのセルばかりならデータ行、日本語などのカラム名があればヘッダー行
  let textCount = 0;
  for (const cell of row) {
    if (/[銀行|支店|口座|名義|氏名|金額|受取|コード|科目]/.test(cell)) {
      return true;
    }
    if (isNaN(Number(cell.trim()))) {
      textCount++;
    }
  }
  return textCount >= Math.floor(row.length / 2);
}

/**
 * 列名から全銀項目を自動推測
 */
export function guessColumnMapping(headers: string[], rows: string[][]): CsvColumnMapping {
  const mapping: CsvColumnMapping = {
    bankCodeCol: -1,
    bankNameCol: -1,
    branchCodeCol: -1,
    branchNameCol: -1,
    accountTypeCol: -1,
    accountNumberCol: -1,
    recipientNameCol: -1,
    amountCol: -1,
    customerCode1Col: -1,
    customerCode2Col: -1,
    ediInfoCol: -1,
  };

  headers.forEach((hdr, idx) => {
    const h = hdr.toLowerCase().replace(/[\s_]/g, '');

    // 銀行コード
    if (/金融機関コード|仕向銀行番号|被仕向銀行番号|銀行コード|銀行番号/.test(h)) {
      mapping.bankCodeCol = idx;
    } else if (/金融機関名|銀行名|被仕向銀行名/.test(h) && mapping.bankNameCol === -1) {
      mapping.bankNameCol = idx;
    }
    // 支店コード
    else if (/支店コード|支店番号|店舗コード|被仕向支店番号/.test(h)) {
      mapping.branchCodeCol = idx;
    } else if (/支店名|店舗名|被仕向支店名/.test(h) && mapping.branchNameCol === -1) {
      mapping.branchNameCol = idx;
    }
    // 預金種目
    else if (/預金種目|預金種別|口座種別|口座種目|科目/.test(h)) {
      mapping.accountTypeCol = idx;
    }
    // 口座番号
    else if (/口座番号|口座番/.test(h)) {
      mapping.accountNumberCol = idx;
    }
    // 受取人名
    else if (/受取人名|受取人カナ|振込先名|振込先カナ|名義人|口座名義|相手先名/.test(h)) {
      mapping.recipientNameCol = idx;
    }
    // 金額
    else if (/振込金額|支払金額|金額|請求金額|総額|振込額/.test(h)) {
      mapping.amountCol = idx;
    }
    // EDI・顧客コード
    else if (/edi|edi情報/.test(h)) {
      mapping.ediInfoCol = idx;
    } else if (/顧客コード1|顧客番号1|取引先コード/.test(h)) {
      mapping.customerCode1Col = idx;
    } else if (/顧客コード2|顧客番号2/.test(h)) {
      mapping.customerCode2Col = idx;
    }
  });

  // 見つからなかった場合のインデックスフォールバック推測
  if (mapping.bankCodeCol === -1 && headers.length >= 8) {
    // 標準的な一般的な振込CSVレイアウト (銀行コード, 銀行名, 支店コード, 支店名, 口座種別, 口座番号, 受取人名, 金額)
    mapping.bankCodeCol = 0;
    mapping.bankNameCol = 1;
    mapping.branchCodeCol = 2;
    mapping.branchNameCol = 3;
    mapping.accountTypeCol = 4;
    mapping.accountNumberCol = 5;
    mapping.recipientNameCol = 6;
    mapping.amountCol = 7;
  }

  return mapping;
}

/**
 * マッピングに基づいてTransferItem配列を抽出
 */
export function extractTransferItemsFromCsv(
  rawRows: string[][],
  mapping: CsvColumnMapping,
  hasHeaderRow: boolean,
  isZenginFormat: boolean
): TransferItem[] {
  const items: TransferItem[] = [];

  if (isZenginFormat) {
    // 全銀CSVフォーマット直接解析 (行区分2がデータレコード)
    rawRows.forEach((row, idx) => {
      if (row[0] === '2' || row[0] === '２') {
        // 全銀CSVデータ行仕様:
        // 0: データ区分 (2)
        // 1: 被仕向銀行番号
        // 2: 被仕向銀行名
        // 3: 被仕向支店番号
        // 4: 被仕向支店名
        // 5: 手形交換所 (省略時0)
        // 6: 預金種目 (1:普通, 2:当座, 4:貯蓄, 9:その他)
        // 7: 口座番号
        // 8: 受取人名
        // 9: 振込金額
        // 10: 新規コード
        // 11: 顧客コード1 or EDI
        // 12: 顧客コード2
        // 13: 振込区分 (7)
        // 14: 識別表示 (Y / 空白)
        const bankCode = (row[1] || '').trim();
        const bankName = (row[2] || '').trim();
        const branchCode = (row[3] || '').trim();
        const branchName = (row[4] || '').trim();
        let accType: AccountType = '1';
        const rawAcc = (row[6] || '1').trim();
        if (['1', '2', '4', '9'].includes(rawAcc)) {
          accType = rawAcc as AccountType;
        }
        const accountNumber = (row[7] || '').trim();
        const recipientName = (row[8] || '').trim();
        const amount = parseInt((row[9] || '0').replace(/[^0-9]/g, ''), 10) || 0;
        const newCode = (row[10] || '0').trim();
        const useEdi = (row[14] || '').toUpperCase() === 'Y';
        const ediInfo = useEdi ? (row[11] || '').trim() : '';
        const customerCode1 = !useEdi ? (row[11] || '').trim() : '';
        const customerCode2 = !useEdi ? (row[12] || '').trim() : '';

        items.push({
          id: `item-${idx}-${Date.now()}`,
          bankCode,
          bankName,
          branchCode,
          branchName,
          accountType: accType,
          accountNumber,
          recipientName: normalizeZenginString(recipientName),
          amount,
          newCode,
          customerCode1,
          customerCode2,
          ediInfo,
          useEdi,
          transferDivision: '7'
        });
      }
    });
    return items;
  }

  // 通常CSV解析
  const startIdx = hasHeaderRow ? 1 : 0;
  for (let i = startIdx; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || row.every(cell => !cell.trim())) continue;

    const getVal = (col: number | string | undefined): string => {
      if (col === undefined || col === -1 || col === null) return '';
      const num = typeof col === 'string' ? parseInt(col, 10) : col;
      return (row[num] || '').trim();
    };

    const rawBankCode = getVal(mapping.bankCodeCol);
    const rawBankName = getVal(mapping.bankNameCol);
    const rawBranchCode = getVal(mapping.branchCodeCol);
    const rawBranchName = getVal(mapping.branchNameCol);
    const rawAccTypeStr = getVal(mapping.accountTypeCol);
    const rawAccNum = getVal(mapping.accountNumberCol);
    const rawRecipient = getVal(mapping.recipientNameCol);
    const rawAmountStr = getVal(mapping.amountCol);

    // 金額パース（カンマや円マーク除去）
    const cleanAmountStr = rawAmountStr.replace(/[^0-9]/g, '');
    const amount = cleanAmountStr ? parseInt(cleanAmountStr, 10) : 0;

    // 口座種別パース（普通->1, 当座->2, 貯蓄->4など）
    let accountType: AccountType = '1';
    if (rawAccTypeStr.includes('当座') || rawAccTypeStr === '2') {
      accountType = '2';
    } else if (rawAccTypeStr.includes('貯蓄') || rawAccTypeStr === '4') {
      accountType = '4';
    } else if (rawAccTypeStr.includes('その他') || rawAccTypeStr === '9') {
      accountType = '9';
    }

    // 口座番号数字抽出
    const accountNumber = rawAccNum.replace(/[^0-9]/g, '');

    // 受取人名の正規化
    const recipientName = normalizeZenginString(rawRecipient);

    items.push({
      id: `csv-${i}-${Date.now()}`,
      bankCode: rawBankCode.replace(/[^0-9]/g, ''),
      bankName: rawBankName,
      branchCode: rawBranchCode.replace(/[^0-9]/g, ''),
      branchName: rawBranchName,
      accountType,
      accountNumber,
      recipientName,
      amount,
      newCode: '0',
      transferDivision: '7'
    });
  }

  return items;
}

/**
 * 経理実務向けサンプルCSVデータの生成
 */
export function generateSampleCsvContent(type: 'standard' | 'zengin_csv'): string {
  if (type === 'zengin_csv') {
    // 全銀CSV形式（PDFマニュアル例準拠）
    return [
      '1,21,0,1234567891,カブシキガイシャサンプル,1025,0005,ミツビシUFJ,001,ホンテン,1,1234567',
      '2,0005,ミツビシUFJ,110,ホンテン,0,1,8000001,マルマルシンブン(カ,100000,0,1234567890,,7,,',
      '2,0005,ミツビシUFJ,650,アベノ,0,1,8000002,マルマルツウシン(カ,100000,0,1234567891,,7,,',
      '2,0001,ミズホ,420,カワサキ,0,1,8000003,マルマルウンユ(ユ,150000,0,,,,7,,',
      '8,3,350000',
      '9'
    ].join('\r\n');
  }

  // 一般的な支払一覧CSV形式
  return [
    '銀行コード,銀行名,支店コード,支店名,口座種別,口座番号,受取人名,振込金額',
    '0005,三菱UFJ銀行,110,本店,普通,8000001,マルマルシンブン(カ,100000',
    '0005,三菱UFJ銀行,650,阿倍野支店,普通,8000002,マルマルツウシン(カ,100000',
    '0001,みずほ銀行,420,川崎支店,普通,8000003,マルマルウンユ(ユ,150000',
    '0009,三井住友銀行,001,東京営業部,当座,7654321,サトウ タロウ,55000'
  ].join('\r\n');
}
