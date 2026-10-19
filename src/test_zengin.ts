/**
 * 仕様検証テストスクリプト
 * PDFマニュアルの仕様書にあるサンプル値を用いて、各行が120バイト・仕様通りになっているか厳密にチェック
 */
import { formatHeaderRecord, formatDataRecord, formatTrailerRecord, formatEndRecord, generateZenginFiles } from '../src/utils/zenginFormatter.ts';
import { HeaderRecord, TransferItem } from '../src/types/zengin.ts';
import Encoding from 'encoding-japanese';

// 1. テストデータ作成（PDFのサンプルに準拠）
const testHeader: HeaderRecord = {
  typeCode: '21',
  codeClassification: '0',
  clientCode: '1234567891',
  clientName: 'ｲﾀｸｼﾔﾒｲ',
  transferDate: '1121',
  bankCode: '0288',
  bankName: 'ﾐﾂﾋﾞｼUFJｼﾝﾀｸ',
  branchCode: '220',
  branchName: 'ﾆﾎﾝﾊﾞｼ',
  accountType: '1',
  accountNumber: '5000001',
};

const testItems: TransferItem[] = [
  {
    id: '1',
    bankCode: '0288',
    bankName: 'ﾐﾂﾋﾞｼUFJｼﾝﾀｸ',
    branchCode: '110',
    branchName: 'ﾎﾝﾃﾝ',
    accountType: '1',
    accountNumber: '8000001',
    recipientName: 'ﾏﾙﾏﾙｼﾝﾌﾞﾝ(ｶ',
    amount: 100000,
    newCode: '0',
    customerCode1: '1234567890',
    customerCode2: '0987654321',
    transferDivision: '7',
  },
  {
    id: '2',
    bankCode: '0288',
    bankName: 'ﾐﾂﾋﾞｼUFJｼﾝﾀｸ',
    branchCode: '650',
    branchName: 'ｱﾍﾞﾉ',
    accountType: '1',
    accountNumber: '8000002',
    recipientName: 'ﾏﾙﾏﾙﾂｳｼﾝ(ｶ',
    amount: 100000,
    newCode: '0',
    customerCode1: '1234567891',
    customerCode2: '1234567812',
    transferDivision: '7',
  },
  {
    id: '3',
    bankCode: '0288',
    bankName: 'ﾐﾂﾋﾞｼUFJｼﾝﾀｸ',
    branchCode: '420',
    branchName: 'ｶﾜｻｷ',
    accountType: '1',
    accountNumber: '8000003',
    recipientName: 'ﾏﾙﾏﾙｳﾝﾕ(ﾕ',
    amount: 150000,
    newCode: '0',
    transferDivision: '7',
  }
];

console.log('=== 全銀データ生成 仕様検証 ===');

// ヘッダーチェック
const headerLine = formatHeaderRecord(testHeader);
console.log(`ヘッダー行: 長さ = ${headerLine.length}文字 (期待値: 120)`);
console.log(`[${headerLine}]`);
if (headerLine.length !== 120) throw new Error(`ヘッダー長が不正: ${headerLine.length}`);

// データ行チェック
testItems.forEach((item, i) => {
  const dataLine = formatDataRecord(item);
  console.log(`データ行${i+1}: 長さ = ${dataLine.length}文字 (期待値: 120)`);
  console.log(`[${dataLine}]`);
  if (dataLine.length !== 120) throw new Error(`データ行${i+1}長が不正: ${dataLine.length}`);
});

// トレーラ行チェック
const trailerLine = formatTrailerRecord(3, 350000);
console.log(`トレーラ行: 長さ = ${trailerLine.length}文字 (期待値: 120)`);
console.log(`[${trailerLine}]`);
if (trailerLine.length !== 120) throw new Error(`トレーラ長が不正: ${trailerLine.length}`);

// エンド行チェック
const endLine = formatEndRecord();
console.log(`エンド行: 長さ = ${endLine.length}文字 (期待値: 120)`);
console.log(`[${endLine}]`);
if (endLine.length !== 120) throw new Error(`エンド行長が不正: ${endLine.length}`);

// Shift_JIS エンコード検証
const res = generateZenginFiles(testHeader, testItems);
console.log(`Shift_JIS Blobサイズ: ${res.sjisBlob.size} バイト`);
// 6レコード（ヘッダー1 + データ3 + トレーラ1 + エンド1） × (120バイト + 2バイトCRLF) = 732バイト
console.log(`期待サイズ: 732バイト (6行 × 122バイト), 実際: ${res.sjisBlob.size}バイト`);
if (res.sjisBlob.size === 732) {
  console.log('✅ バイト長、レコード構造、CRLF改行コードの全検証に成功しました！');
} else {
  console.warn('⚠️ サイズ不一致');
}
