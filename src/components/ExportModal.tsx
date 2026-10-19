import React, { useState } from 'react';
import { HeaderRecord, TransferItem, TRANSFER_TYPES } from '../types/zengin';
import { generateZenginFiles } from '../utils/zenginFormatter';
import { X, Download, Copy, Check, FileCheck, Info, ShieldCheck } from 'lucide-react';

interface ExportModalProps {
  header: HeaderRecord;
  items: TransferItem[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ header, items, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  const result = generateZenginFiles(header, items);
  const typeLabel = TRANSFER_TYPES.find(t => t.code === header.typeCode)?.label || '総合振込';

  // デフォルトファイル名
  const dateStr = header.transferDate || 'MMDD';
  const fileNameBase = `ZENGIN_${header.typeCode}_${dateStr}`;

  // Shift_JISダウンロード
  const handleDownloadSjis = () => {
    const url = URL.createObjectURL(result.sjisBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileNameBase}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedFormat('Shift_JIS (.txt)');
  };

  // .dat 形式（一部銀行向け）
  const handleDownloadDat = () => {
    const url = URL.createObjectURL(result.sjisBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileNameBase}.dat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloadedFormat('Shift_JIS (.dat)');
  };

  // UTF-8ダウンロード
  const handleDownloadUtf8 = () => {
    const url = URL.createObjectURL(result.utf8Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileNameBase}_utf8.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedFormat('UTF-8 (.txt)');
  };

  // クリップボードコピー
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(result.fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#37352F]">全銀協フォーマット データ生成完了</h3>
              <p className="text-[11px] text-[#787774]">
                {typeLabel} | {result.summary.totalCount}件 | ¥{result.summary.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* ダウンロード完了時のフィードバック */}
          {downloadedFormat && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>{downloadedFormat}</strong> をダウンロードしました。金融機関の振込データ受付画面からアップロードしてください。
              </span>
            </div>
          )}

          {/* ダウンロード選択カード */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-gray-700 block">
              1. 推奨形式でダウンロード
            </span>

            {/* Shift_JIS .txt (最も標準的) */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 transition flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-blue-900">Shift_JIS (.txt)</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-600 text-white rounded">
                    銀行標準・推奨
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  三菱UFJ、三井住友、みずほなど各行の法人ネットバンキング対応
                </p>
              </div>
              <button
                onClick={handleDownloadSjis}
                className="notion-btn-primary text-xs px-4 py-2 flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ダウンロード</span>
              </button>
            </div>

            {/* その他の形式 */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleDownloadDat}
                className="notion-btn-secondary text-xs flex items-center justify-center space-x-1.5 py-2"
                title="拡張子が.dat指定の金融機関システム向け"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>.dat 形式 (Shift_JIS)</span>
              </button>

              <button
                onClick={handleDownloadUtf8}
                className="notion-btn-secondary text-xs flex items-center justify-center space-x-1.5 py-2"
                title="最新のクラウドシステムやエディタ確認用"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>UTF-8 (.txt)</span>
              </button>
            </div>
          </div>

          {/* クリップボードコピー */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              テキストエディタで直接確認したい場合
            </div>
            <button
              onClick={handleCopyText}
              className="notion-btn-secondary text-xs flex items-center space-x-1.5 py-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">コピーしました</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span>全テキストをコピー</span>
                </>
              )}
            </button>
          </div>

          {/* 安全・仕様ワンポイント */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-[11px] text-gray-500 space-y-1">
            <div className="flex items-center space-x-1 font-semibold text-gray-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>全銀協仕様チェック済み</span>
            </div>
            <p>
              ・1レコード120バイト固定長、改行コードCRLF (0x0D 0x0A) 付加
              <br />
              ・受取人名・依頼人名は半角カタカナ（濁点等も半角2文字）に正規化済み
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="notion-btn-secondary text-xs"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
