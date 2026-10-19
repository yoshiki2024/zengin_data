import React, { useState } from 'react';
import { HeaderRecord, TRANSFER_TYPES, TransferType } from '../types/zengin';
import { Building2, Calendar, ChevronDown, ChevronUp, Save, Check } from 'lucide-react';
import { normalizeZenginString } from '../utils/kanaUtils';
import { saveHeader } from '../utils/storage';

interface ClientInfoFormProps {
  header: HeaderRecord;
  onChange: (newHeader: HeaderRecord) => void;
  compact?: boolean;
}

export const ClientInfoForm: React.FC<ClientInfoFormProps> = ({ header, onChange, compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [savedNotification, setSavedNotification] = useState(false);

  const handleChange = (field: keyof HeaderRecord, value: any) => {
    let finalValue = value;
    if (field === 'clientName' || field === 'bankName' || field === 'branchName') {
      finalValue = normalizeZenginString(value);
    }
    const updated = { ...header, [field]: finalValue };
    onChange(updated);
    saveHeader(updated);
    
    // 保存通知のアニメーション
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  return (
    <div className="bg-white border border-[#E9E9E7] rounded-xl p-5 mb-6 shadow-sm transition-all">
      {/* タイトルバー・展開トグル */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm text-[#37352F]">
                依頼人情報・振込基本設定（自社口座）
              </h3>
              {savedNotification ? (
                <span className="flex items-center space-x-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded transition">
                  <Check className="w-3 h-3" />
                  <span>自動保存済</span>
                </span>
              ) : (
                <span className="text-[11px] text-gray-400">ブラウザ内に自動保存</span>
              )}
            </div>
            <p className="text-xs text-[#787774]">
              {header.clientName ? `${header.clientName} | ` : ''}
              {TRANSFER_TYPES.find(t => t.code === header.typeCode)?.label || '総合振込'}
              {header.transferDate ? ` | 指定日: ${header.transferDate.slice(0, 2)}月${header.transferDate.slice(2, 4)}日` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[#787774] text-xs">
          <span>{isExpanded ? '折りたたむ' : '編集する'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* フォーム入力エリア */}
      {isExpanded && (
        <div className="mt-5 pt-4 border-t border-gray-100 space-y-4 animate-in fade-in duration-150">
          {/* 行1: 振込種別・取組日・委託者コード */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                振込種別 <span className="text-red-500">*</span>
              </label>
              <select
                value={header.typeCode}
                onChange={(e) => handleChange('typeCode', e.target.value as TransferType)}
                className="notion-input"
              >
                {TRANSFER_TYPES.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center justify-between">
                <span>振込指定日 (MMDD) <span className="text-red-500">*</span></span>
                <span className="text-[11px] text-gray-400">例: 1025</span>
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="1025"
                value={header.transferDate}
                onChange={(e) => handleChange('transferDate', e.target.value.replace(/[^0-9]/g, ''))}
                className="notion-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center justify-between">
                <span>委託者コード (10桁) <span className="text-red-500">*</span></span>
                <span className="text-[11px] text-gray-400">銀行契約コード</span>
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="1234567890"
                value={header.clientCode}
                onChange={(e) => handleChange('clientCode', e.target.value.replace(/[^0-9]/g, ''))}
                className="notion-input font-mono"
              />
            </div>
          </div>

          {/* 行2: 依頼人名（委託者名） */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center justify-between">
              <span>依頼人名（カナ・英数最大40文字） <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-gray-400">漢字や全角カナは自動で半角カナに変換されます</span>
            </label>
            <input
              type="text"
              placeholder="ｶ) ｻﾝﾌﾟﾙｼｮｳｼﾞ"
              value={header.clientName}
              onChange={(e) => handleChange('clientName', e.target.value)}
              className="notion-input font-mono"
            />
          </div>

          {/* 行3: 仕向金融機関（自社口座情報） */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                仕向銀行コード (4桁) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="0005"
                value={header.bankCode}
                onChange={(e) => handleChange('bankCode', e.target.value.replace(/[^0-9]/g, ''))}
                className="notion-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                仕向銀行名（カナ省略可）
              </label>
              <input
                type="text"
                maxLength={15}
                placeholder="ﾐﾂﾋﾞｼUFJ"
                value={header.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                className="notion-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                仕向支店コード (3桁) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={3}
                placeholder="001"
                value={header.branchCode}
                onChange={(e) => handleChange('branchCode', e.target.value.replace(/[^0-9]/g, ''))}
                className="notion-input font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                仕向支店名（カナ省略可）
              </label>
              <input
                type="text"
                maxLength={15}
                placeholder="ﾎﾝﾃﾝ"
                value={header.branchName}
                onChange={(e) => handleChange('branchName', e.target.value)}
                className="notion-input font-mono"
              />
            </div>
          </div>

          {/* 行4: 口座種別・口座番号 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                依頼人預金種目 <span className="text-red-500">*</span>
              </label>
              <select
                value={header.accountType}
                onChange={(e) => handleChange('accountType', e.target.value as '1' | '2')}
                className="notion-input"
              >
                <option value="1">普通預金 (1)</option>
                <option value="2">当座預金 (2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                依頼人口座番号 (7桁) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={7}
                placeholder="1234567"
                value={header.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value.replace(/[^0-9]/g, ''))}
                className="notion-input font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
