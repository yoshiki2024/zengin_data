import React, { useState, useMemo } from 'react';
import { HeaderRecord, TransferItem, ACCOUNT_TYPES, TRANSFER_TYPES } from '../types/zengin';
import { generateZenginFiles } from '../utils/zenginFormatter';
import { CheckCircle2, AlertTriangle, ArrowLeft, Download, Eye, FileCode2, Search, ArrowUpDown } from 'lucide-react';

interface ConfirmSummaryProps {
  header: HeaderRecord;
  items: TransferItem[];
  onBack: () => void;
  onOpenExportModal: () => void;
}

export const ConfirmSummary: React.FC<ConfirmSummaryProps> = ({
  header,
  items,
  onBack,
  onOpenExportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRawPreview, setShowRawPreview] = useState(false);

  // 全銀データ生成＆バリデーション結果の計算
  const generationResult = useMemo(() => {
    return generateZenginFiles(header, items);
  }, [header, items]);

  const { summary, records } = generationResult;

  // フィルタリング
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      item.recipientName.toLowerCase().includes(term) ||
      item.bankCode.includes(term) ||
      (item.bankName && item.bankName.toLowerCase().includes(term)) ||
      item.accountNumber.includes(term)
    );
  }, [items, searchTerm]);

  const typeLabel = TRANSFER_TYPES.find(t => t.code === header.typeCode)?.label || '総合振込';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ページ上部 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#37352F]">
            振込内容の確認・バリデーション結果
          </h2>
          <p className="text-xs sm:text-sm text-[#787774] mt-1">
            生成前の内容を精査しました。合計金額や支払先情報に誤りがないかご確認ください。
          </p>
        </div>
        <button
          onClick={onBack}
          className="notion-btn-secondary text-xs flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>編集に戻る</span>
        </button>
      </div>

      {/* バリデーション警告・エラー表示 */}
      {summary.errors.length > 0 && (
        <div className={`mb-6 p-4 rounded-xl border ${
          summary.hasErrors ? 'bg-red-50/70 border-red-200 text-red-900' : 'bg-amber-50/70 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center space-x-2 font-semibold text-sm mb-2">
            <AlertTriangle className={`w-4 h-4 ${summary.hasErrors ? 'text-red-600' : 'text-amber-600'}`} />
            <span>
              {summary.hasErrors
                ? `${summary.errors.filter(e => e.severity === 'error').length} 件の入力エラーが検知されました（全銀データ生成前に修正が必要です）`
                : `${summary.errors.length} 件の注意・警告があります`}
            </span>
          </div>
          <ul className="list-disc list-inside text-xs space-y-1 pl-1">
            {summary.errors.map((err, idx) => (
              <li key={idx} className={err.severity === 'error' ? 'text-red-700' : 'text-amber-700'}>
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* サマリーカード・グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* カード1: 合計金額 */}
        <div className="bg-white border border-[#E9E9E7] rounded-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-[#787774] block mb-1">振込総額（合計金額）</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#37352F]">
              ¥{summary.totalAmount.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">JPY</span>
          </div>
          <span className="text-[11px] text-gray-400 mt-2 block">
            データレコード合計件数: {summary.totalCount} 件
          </span>
        </div>

        {/* カード2: 振込基本情報 */}
        <div className="bg-white border border-[#E9E9E7] rounded-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-[#787774] block mb-1">振込種別・指定日</span>
          <div className="text-lg font-semibold text-[#37352F] flex items-center space-x-2">
            <span>{typeLabel}</span>
            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-normal">
              コード: {header.typeCode}
            </span>
          </div>
          <span className="text-xs text-gray-500 mt-1 block font-mono">
            振込指定日: {header.transferDate.slice(0, 2)}月{header.transferDate.slice(2, 4)}日 (MMDD: {header.transferDate})
          </span>
        </div>

        {/* カード3: 自社（依頼人）口座情報 */}
        <div className="bg-white border border-[#E9E9E7] rounded-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-[#787774] block mb-1">依頼人（引落口座）</span>
          <div className="text-sm font-semibold text-[#37352F] truncate">
            {header.clientName || '（依頼人名未入力）'}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-mono">
            {header.bankName || header.bankCode} / {header.accountType === '2' ? '当座' : '普通'} {header.accountNumber}
          </div>
          <span className="text-[11px] text-gray-400 block mt-0.5 font-mono">
            委託者コード: {header.clientCode}
          </span>
        </div>
      </div>

      {/* 支払先一覧プレビュー */}
      <div className="bg-white border border-[#E9E9E7] rounded-xl overflow-hidden shadow-sm mb-6">
        <div className="px-5 py-3.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-xs text-gray-800">
              支払先一覧プレビュー ({filteredItems.length}件 / 全{items.length}件)
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {/* 検索インプット */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="受取人名・口座番号で絞り込み..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-white border border-gray-200 rounded-md text-[#37352F] focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
              />
            </div>

            {/* 固定長レコード生データ切替ボタン */}
            <button
              onClick={() => setShowRawPreview(!showRawPreview)}
              className="notion-btn-secondary text-xs flex items-center space-x-1"
            >
              <FileCode2 className="w-3.5 h-3.5 text-gray-500" />
              <span>{showRawPreview ? '通常表示' : '120B固定長生データ'}</span>
            </button>
          </div>
        </div>

        {/* 生レコードプレビューモード */}
        {showRawPreview ? (
          <div className="p-4 bg-[#1E1E1E] text-green-400 font-mono text-xs overflow-x-auto leading-relaxed">
            <div className="text-gray-400 mb-2 pb-2 border-b border-gray-700 flex justify-between">
              <span>全銀協固定長120バイト レコードダンプ（CRLF区切り）</span>
              <span>1行 = 120文字 + 改行</span>
            </div>
            {records.map((rec, i) => (
              <div key={i} className="whitespace-pre py-0.5 hover:bg-white/10 rounded px-1">
                <span className="text-gray-500 inline-block w-8 select-none">{rec.lineNumber}:</span>
                <span className={
                  rec.lineType === 'header' ? 'text-amber-300' :
                  rec.lineType === 'trailer' ? 'text-blue-300' :
                  rec.lineType === 'end' ? 'text-purple-300' : 'text-green-300'
                }>{rec.rawText}</span>
              </div>
            ))}
          </div>
        ) : (
          /* 通常テーブル表示 */
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="p-2.5 text-center w-10 font-medium">#</th>
                  <th className="p-2.5 font-medium">金融機関（コード）</th>
                  <th className="p-2.5 font-medium">支店（コード）</th>
                  <th className="p-2.5 font-medium">預金種目</th>
                  <th className="p-2.5 font-medium">口座番号</th>
                  <th className="p-2.5 font-medium">受取人名（半角カナ）</th>
                  <th className="p-2.5 font-medium text-right">振込金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {filteredItems.map((item, index) => {
                  const accTypeName = ACCOUNT_TYPES.find(a => a.code === item.accountType)?.label || '普通';
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/20">
                      <td className="p-2.5 text-center text-gray-400">{index + 1}</td>
                      <td className="p-2.5 text-gray-800">
                        {item.bankName ? `${item.bankName} (${item.bankCode})` : item.bankCode}
                      </td>
                      <td className="p-2.5 text-gray-800">
                        {item.branchName ? `${item.branchName} (${item.branchCode})` : item.branchCode}
                      </td>
                      <td className="p-2.5 text-gray-800 font-sans">
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px]">
                          {accTypeName}
                        </span>
                      </td>
                      <td className="p-2.5 text-gray-800">{item.accountNumber}</td>
                      <td className="p-2.5 text-gray-900 font-semibold">{item.recipientName}</td>
                      <td className="p-2.5 text-right font-bold text-gray-900">
                        ¥{item.amount?.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 最下部アクションバー */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="notion-btn-secondary text-sm"
        >
          前の画面に戻って修正
        </button>

        <button
          onClick={onOpenExportModal}
          disabled={summary.hasErrors}
          className="notion-btn-primary flex items-center space-x-2 px-8 py-3 text-sm shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>全銀データを生成・ダウンロード</span>
        </button>
      </div>
    </div>
  );
};
