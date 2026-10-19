import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, Settings2, RefreshCw } from 'lucide-react';
import { HeaderRecord, TransferItem } from '../types/zengin';
import { readCsvFileWithAutoEncoding, parseCsvContent, extractTransferItemsFromCsv, CsvColumnMapping } from '../utils/csvParser';
import { ClientInfoForm } from './ClientInfoForm';

interface CsvFlowProps {
  header: HeaderRecord;
  onHeaderChange: (newHeader: HeaderRecord) => void;
  onProceedToConfirm: (items: TransferItem[]) => void;
  onCancel: () => void;
}

export const CsvFlow: React.FC<CsvFlowProps> = ({
  header,
  onHeaderChange,
  onProceedToConfirm,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [csvText, setCsvText] = useState<string>('');
  const [encoding, setEncoding] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping | null>(null);
  const [isZenginCsv, setIsZenginCsv] = useState(false);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [showMappingSettings, setShowMappingSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル読み込み処理
  const processFile = async (selectedFile: File) => {
    setErrorMsg(null);
    try {
      const { text, encoding: enc } = await readCsvFileWithAutoEncoding(selectedFile);
      setFile(selectedFile);
      setCsvText(text);
      setEncoding(enc);

      const parsed = parseCsvContent(text);
      setHeaders(parsed.headers);
      setRawRows(parsed.rawRows);
      setMapping(parsed.guessedMapping);
      setIsZenginCsv(parsed.isZenginCsvFormat);

      // 全銀CSV形式の場合、ヘッダー情報を自動更新
      if (parsed.isZenginCsvFormat && parsed.zenginHeaderInfo) {
        onHeaderChange({
          ...header,
          ...parsed.zenginHeaderInfo,
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'CSVファイルの解析に失敗しました。');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0];
      if (f.name.endsWith('.csv') || f.name.endsWith('.txt')) {
        processFile(f);
      } else {
        setErrorMsg('CSVまたはテキストファイル（.csv / .txt）を選択してください。');
      }
    }
  };

  // 次へ進む（確認画面へ）
  const handleProceed = () => {
    if (!mapping || rawRows.length === 0) return;
    try {
      const items = extractTransferItemsFromCsv(rawRows, mapping, hasHeaderRow, isZenginCsv);
      if (items.length === 0) {
        setErrorMsg('有効な振込先レコードが1件も抽出できませんでした。列の対応関係をご確認ください。');
        return;
      }
      onProceedToConfirm(items);
    } catch (e: any) {
      setErrorMsg(e.message || 'データ抽出中にエラーが発生しました。');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ページ見出し */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#37352F]">
            CSVファイルから全銀データを作成
          </h2>
          <p className="text-xs sm:text-sm text-[#787774] mt-1">
            支払一覧CSVを取り込み、全銀協フォーマットへ一括変換します。
          </p>
        </div>
        <button
          onClick={onCancel}
          className="notion-btn-secondary text-xs"
        >
          選択画面へ戻る
        </button>
      </div>

      {/* エラー表示 */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-sm text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">エラー</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* 1. ファイルアップロード領域 */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
            accept=".csv,.txt"
            className="hidden"
          />
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            ここにCSVファイルをドラッグ＆ドロップ
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            またはクリックしてファイルを選択（Shift_JIS / UTF-8 両対応）
          </p>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-200">
            <span>会計ソフト出力CSV、支払一覧CSV、全銀CSVに対応</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ファイルステータスカード */}
          <div className="bg-white border border-[#E9E9E7] rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-[#37352F]">{file.name}</span>
                  <span className="px-2 py-0.5 text-[11px] bg-emerald-50 text-emerald-700 font-medium rounded">
                    文字コード: {encoding}
                  </span>
                  {isZenginCsv && (
                    <span className="px-2 py-0.5 text-[11px] bg-purple-50 text-purple-700 font-medium rounded">
                      全銀協標準CSV検知
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  データ行数: {rawRows.length} 行 | サイズ: {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setRawRows([]);
                setHeaders([]);
                setMapping(null);
              }}
              className="notion-btn-secondary text-xs flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              <span>別のCSVを選択</span>
            </button>
          </div>

          {/* 2. 依頼人情報（自社口座）の入力・確認 */}
          <ClientInfoForm header={header} onChange={onHeaderChange} />

          {/* 3. 列マッピング設定（通常CSVの場合） */}
          {!isZenginCsv && mapping && (
            <div className="bg-white border border-[#E9E9E7] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Settings2 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-sm text-[#37352F]">
                    CSVの列マッピング設定（自動判別済）
                  </h3>
                </div>
                <button
                  onClick={() => setShowMappingSettings(!showMappingSettings)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {showMappingSettings ? '簡易表示にする' : '対応列を手動で変更する'}
                </button>
              </div>

              {/* 簡易タグ表示 */}
              {!showMappingSettings ? (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-gray-700">
                    銀行コード: <strong>{typeof mapping.bankCodeCol === 'number' && mapping.bankCodeCol >= 0 ? headers[mapping.bankCodeCol] : '未指定'}</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-gray-700">
                    支店コード: <strong>{typeof mapping.branchCodeCol === 'number' && mapping.branchCodeCol >= 0 ? headers[mapping.branchCodeCol] : '未指定'}</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-gray-700">
                    口座種別: <strong>{typeof mapping.accountTypeCol === 'number' && mapping.accountTypeCol >= 0 ? headers[mapping.accountTypeCol] : '普通(既定)'}</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-gray-700">
                    口座番号: <strong>{typeof mapping.accountNumberCol === 'number' && mapping.accountNumberCol >= 0 ? headers[mapping.accountNumberCol] : '未指定'}</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-gray-700">
                    受取人名: <strong>{typeof mapping.recipientNameCol === 'number' && mapping.recipientNameCol >= 0 ? headers[mapping.recipientNameCol] : '未指定'}</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-gray-700">
                    振込金額: <strong>{typeof mapping.amountCol === 'number' && mapping.amountCol >= 0 ? headers[mapping.amountCol] : '未指定'}</strong>
                  </span>
                </div>
              ) : (
                /* 手動マッピンググリッド */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100 text-xs">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">銀行コード列</label>
                    <select
                      value={mapping.bankCodeCol}
                      onChange={(e) => setMapping({ ...mapping, bankCodeCol: Number(e.target.value) })}
                      className="notion-input"
                    >
                      <option value={-1}>未指定</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">支店コード列</label>
                    <select
                      value={mapping.branchCodeCol}
                      onChange={(e) => setMapping({ ...mapping, branchCodeCol: Number(e.target.value) })}
                      className="notion-input"
                    >
                      <option value={-1}>未指定</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">口座種別列</label>
                    <select
                      value={mapping.accountTypeCol}
                      onChange={(e) => setMapping({ ...mapping, accountTypeCol: Number(e.target.value) })}
                      className="notion-input"
                    >
                      <option value={-1}>未指定 (普通預金扱い)</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">口座番号列</label>
                    <select
                      value={mapping.accountNumberCol}
                      onChange={(e) => setMapping({ ...mapping, accountNumberCol: Number(e.target.value) })}
                      className="notion-input"
                    >
                      <option value={-1}>未指定</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">受取人名（カナ）列</label>
                    <select
                      value={mapping.recipientNameCol}
                      onChange={(e) => setMapping({ ...mapping, recipientNameCol: Number(e.target.value) })}
                      className="notion-input"
                    >
                      <option value={-1}>未指定</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">振込金額列</label>
                    <select
                      value={mapping.amountCol}
                      onChange={(e) => setMapping({ ...mapping, amountCol: Number(e.target.value) })}
                      className="notion-input"
                    >
                      <option value={-1}>未指定</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. 元CSVデータの簡易プレビュー */}
          <div className="bg-white border border-[#E9E9E7] rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-700">
                読み込みデータ プレビュー（先頭最大5行）
              </span>
              <span className="text-xs text-gray-400">
                合計 {rawRows.length} 件
              </span>
            </div>
            <div className="overflow-x-auto max-h-60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                    <th className="p-2 border-r border-gray-200 text-center w-12 font-medium">#</th>
                    {headers.map((hdr, idx) => (
                      <th key={idx} className="p-2 border-r border-gray-200 font-medium whitespace-nowrap">
                        {hdr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {rawRows.slice(hasHeaderRow ? 1 : 0, 6).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-blue-50/30">
                      <td className="p-2 border-r border-gray-100 text-center text-gray-400">
                        {rowIdx + 1}
                      </td>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="p-2 border-r border-gray-100 whitespace-nowrap text-gray-800">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={onCancel}
              className="notion-btn-secondary text-sm"
            >
              戻る
            </button>

            <button
              onClick={handleProceed}
              className="notion-btn-primary flex items-center space-x-2 px-6 py-2.5 text-sm"
            >
              <span>確認画面へ進む（サマリー表示）</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
