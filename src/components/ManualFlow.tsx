import React, { useState, useRef } from 'react';
import { HeaderRecord, TransferItem, ACCOUNT_TYPES, AccountType } from '../types/zengin';
import { ClientInfoForm } from './ClientInfoForm';
import { Plus, Trash2, Copy, ArrowRight, AlertCircle, GripVertical, CheckSquare, Square, MinusSquare, Layers } from 'lucide-react';
import { normalizeZenginString } from '../utils/kanaUtils';

interface ManualFlowProps {
  header: HeaderRecord;
  onHeaderChange: (newHeader: HeaderRecord) => void;
  onProceedToConfirm: (items: TransferItem[]) => void;
  onCancel: () => void;
}

export const ManualFlow: React.FC<ManualFlowProps> = ({
  header,
  onHeaderChange,
  onProceedToConfirm,
  onCancel,
}) => {
  const createEmptyItem = (): TransferItem => ({
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    bankCode: '',
    bankName: '',
    branchCode: '',
    branchName: '',
    accountType: '1',
    accountNumber: '',
    recipientName: '',
    amount: 0,
    newCode: '0',
    transferDivision: '7'
  });

  const [items, setItems] = useState<TransferItem[]>([
    {
      id: 'item-1',
      bankCode: '0005',
      bankName: 'ミツビシUFJ',
      branchCode: '110',
      branchName: 'ホンテン',
      accountType: '1',
      accountNumber: '8000001',
      recipientName: 'マルマルシンブン(カ',
      amount: 100000,
      newCode: '0',
      transferDivision: '7'
    },
    {
      id: 'item-2',
      bankCode: '0001',
      bankName: 'ミズホ',
      branchCode: '420',
      branchName: 'カワサキ',
      accountType: '1',
      accountNumber: '8000002',
      recipientName: 'サトウ タロウ',
      amount: 150000,
      newCode: '0',
      transferDivision: '7'
    },
    {
      id: 'item-3',
      bankCode: '0009',
      bankName: 'ミツイスミトモ',
      branchCode: '001',
      branchName: 'トウキョウ',
      accountType: '1',
      accountNumber: '8000003',
      recipientName: 'ヤマダ ハナコ',
      amount: 80000,
      newCode: '0',
      transferDivision: '7'
    },
    {
      id: 'item-4',
      bankCode: '0288',
      bankName: 'ミツビシUFJシンタク',
      branchCode: '220',
      branchName: 'ニホンバシ',
      accountType: '2',
      accountNumber: '5000001',
      recipientName: 'スズキ イチロウ',
      amount: 220000,
      newCode: '0',
      transferDivision: '7'
    }
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 複数選択用の状態
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // ドラッグ＆ドロップ用の状態
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' } | null>(null);

  // 行の追加
  const handleAddItem = () => {
    const newItem = createEmptyItem();
    setItems([...items, newItem]);
  };

  // 行の複製（単一）
  const handleDuplicateItem = (index: number) => {
    const target = items[index];
    const duplicated: TransferItem = {
      ...target,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    const next = [...items];
    next.splice(index + 1, 0, duplicated);
    setItems(next);
  };

  // 選択行の一括複製
  const handleDuplicateSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedSet = new Set(selectedIds);
    const newItems: TransferItem[] = [];
    const newSelectedIds: string[] = [];

    items.forEach(item => {
      newItems.push(item);
      if (selectedSet.has(item.id)) {
        const dup: TransferItem = {
          ...item,
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        };
        newItems.push(dup);
        newSelectedIds.push(dup.id);
      }
    });

    setItems(newItems);
    setSelectedIds(newSelectedIds);
  };

  // 行の削除（単一）
  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg('最低1行の振込データが必要です。');
      return;
    }
    const itemToDelete = items[index];
    setSelectedIds(prev => prev.filter(id => id !== itemToDelete.id));
    const next = items.filter((_, idx) => idx !== index);
    setItems(next);
  };

  // 選択行の一括削除
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (items.length <= selectedIds.length) {
      setErrorMsg('最低1行の振込データが必要です。すべての行を削除することはできません。');
      return;
    }
    const selectedSet = new Set(selectedIds);
    const next = items.filter(item => !selectedSet.has(item.id));
    setItems(next);
    setSelectedIds([]);
    setLastSelectedId(null);
  };

  // セルの更新
  const handleItemChange = (index: number, field: keyof TransferItem, value: any) => {
    const next = [...items];
    let val = value;

    if (field === 'recipientName' || field === 'bankName' || field === 'branchName') {
      val = normalizeZenginString(value);
    } else if (field === 'bankCode' || field === 'branchCode' || field === 'accountNumber') {
      val = String(value).replace(/[^0-9]/g, '');
    } else if (field === 'amount') {
      const num = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
      val = isNaN(num) ? 0 : num;
    }

    next[index] = { ...next[index], [field]: val };
    setItems(next);
  };

  // --- 選択処理（Shift範囲選択対応） ---
  const handleToggleSelect = (id: string, shiftKey: boolean = false) => {
    if (shiftKey && lastSelectedId) {
      // 範囲選択
      const lastIndex = items.findIndex(item => item.id === lastSelectedId);
      const currentIndex = items.findIndex(item => item.id === id);
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = items.slice(start, end + 1).map(item => item.id);
        const nextSet = new Set([...selectedIds, ...rangeIds]);
        setSelectedIds(Array.from(nextSet));
        return;
      }
    }

    // 単一トグル
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
      setLastSelectedId(id);
    }
  };

  // 全選択・全解除
  const handleToggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  // --- ドラッグ＆ドロップ処理 ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    let movingIds: string[] = [];
    if (selectedIds.includes(id)) {
      // 選択中の行をまとめてドラッグ
      movingIds = items.filter(item => selectedIds.includes(item.id)).map(item => item.id);
    } else {
      // 単一行ドラッグ
      movingIds = [id];
      setSelectedIds([id]);
      setLastSelectedId(id);
    }

    setDraggedIds(movingIds);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(movingIds));

    // ドラッグプレビュー用のゴーストテキスト設定
    const ghost = document.createElement('div');
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.padding = '6px 12px';
    ghost.style.backgroundColor = '#2383E2';
    ghost.style.color = '#ffffff';
    ghost.style.borderRadius = '6px';
    ghost.style.fontSize = '12px';
    ghost.style.fontWeight = 'bold';
    ghost.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    ghost.innerText = `${movingIds.length} 行を移動中`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedIds.length === 0) return;
    // ターゲットがドラッグ対象自体に含まれている場合はドロップ対象外
    if (draggedIds.includes(targetId)) {
      setDropTarget(null);
      return;
    }

    e.dataTransfer.dropEffect = 'move';

    // マウスカーソルのY位置（要素の上半分か下半分か）を判定
    const targetElement = e.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';

    setDropTarget({ id: targetId, position });
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedIds.length === 0 || !dropTarget) {
      setDraggedIds([]);
      setDropTarget(null);
      return;
    }

    // 順序入れ替え処理
    const selectedSet = new Set(draggedIds);
    // 移動するアイテム（元の順序を維持）
    const movingItems = items.filter(item => selectedSet.has(item.id));
    // 移動しない残りのアイテム
    const remainingItems = items.filter(item => !selectedSet.has(item.id));

    // ドロップ先のインデックス
    const targetIndex = remainingItems.findIndex(item => item.id === targetId);
    if (targetIndex === -1) {
      setDraggedIds([]);
      setDropTarget(null);
      return;
    }

    const insertIndex = dropTarget.position === 'before' ? targetIndex : targetIndex + 1;

    // 新しい配列を構築
    const reordered = [
      ...remainingItems.slice(0, insertIndex),
      ...movingItems,
      ...remainingItems.slice(insertIndex)
    ];

    setItems(reordered);
    setDraggedIds([]);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedIds([]);
    setDropTarget(null);
  };

  // 合計の計算
  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  // 確認画面へ進む
  const handleProceed = () => {
    setErrorMsg(null);
    if (items.length === 0) {
      setErrorMsg('振込先データを1件以上入力してください。');
      return;
    }
    // 簡単な事前チェック
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.bankCode || !item.branchCode || !item.accountNumber || !item.recipientName || !item.amount) {
        setErrorMsg(`行 ${i + 1} に未入力の必須項目があります（銀行コード、支店コード、口座番号、受取人名、金額）。`);
        return;
      }
    }
    onProceedToConfirm(items);
  };

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < items.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ページヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#37352F]">
            画面入力で全銀データを作成
          </h2>
          <p className="text-xs sm:text-sm text-[#787774] mt-1">
            スプレッドシート形式のテーブルで、振込先と金額を直接入力・編集します。ドラッグ＆ドロップで複数行をまとめて移動できます。
          </p>
        </div>
        <button
          onClick={onCancel}
          className="notion-btn-secondary text-xs"
        >
          選択画面へ戻る
        </button>
      </div>

      {/* エラーメッセージ */}
      {errorMsg && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. 依頼人情報 */}
      <ClientInfoForm header={header} onChange={onHeaderChange} compact={false} />

      {/* 2. 支払先データベース（スプレッドシート風） */}
      <div className="bg-white border border-[#E9E9E7] rounded-xl overflow-hidden shadow-sm mb-6">
        {/* テーブルヘッダー操作バー */}
        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/60">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-gray-800">
              支払先一覧（振込データレコード）
            </span>
            <span className="text-xs text-gray-400">
              {items.length} 件 | 合計: ¥{totalAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* 複数選択時のアクションバー */}
            {selectedIds.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md text-xs text-blue-900 animate-in fade-in duration-100">
                <span className="font-semibold text-blue-700 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{selectedIds.length} 行選択中</span>
                </span>
                <span className="text-blue-300">|</span>
                <button
                  onClick={handleDuplicateSelected}
                  className="hover:underline text-blue-800 font-medium px-1"
                  title="選択行をすべて複製"
                >
                  複製
                </button>
                <span className="text-blue-300">|</span>
                <button
                  onClick={handleDeleteSelected}
                  className="hover:underline text-red-600 font-medium px-1"
                  title="選択行をすべて削除"
                >
                  削除
                </button>
                <span className="text-blue-300">|</span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="hover:underline text-gray-500 px-1"
                >
                  解除
                </button>
              </div>
            )}

            <button
              onClick={handleAddItem}
              className="notion-btn-secondary text-xs flex items-center space-x-1 py-1"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>行を追加</span>
            </button>
          </div>
        </div>

        {/* ドラッグ操作のヒント */}
        <div className="px-5 py-1.5 bg-blue-50/40 border-b border-blue-100/60 text-[11px] text-blue-700 flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <GripVertical className="w-3 h-3 text-blue-500" />
            <span>左端のアイコン（⋮⋮）をドラッグして行を並び替えできます。チェックボックスで複数行を選択すれば、ブロックごと一括移動可能です。</span>
          </span>
          <span className="text-gray-400 hidden sm:inline">Shiftキー併用で連続範囲選択</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                {/* 選択全チェックボックス & ハンドル列 */}
                <th className="p-2 border-r border-gray-200 text-center w-14 font-medium select-none">
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-gray-500 hover:text-blue-600"
                      title={isAllSelected ? 'すべての選択を解除' : 'すべての行を選択'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                      ) : isPartiallySelected ? (
                        <MinusSquare className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </th>
                <th className="p-2 border-r border-gray-200 text-center w-10 font-medium">#</th>
                <th className="p-2.5 border-r border-gray-200 font-medium min-w-[90px]">
                  銀行コード <span className="text-red-500">*</span>
                </th>
                <th className="p-2.5 border-r border-gray-200 font-medium min-w-[110px]">
                  銀行名（カナ）
                </th>
                <th className="p-2.5 border-r border-gray-200 font-medium min-w-[80px]">
                  支店コード <span className="text-red-500">*</span>
                </th>
                <th className="p-2.5 border-r border-gray-200 font-medium min-w-[100px]">
                  支店名（カナ）
                </th>
                <th className="p-2.5 border-r border-gray-200 font-medium min-w-[80px]">
                  科目 <span className="text-red-500">*</span>
                </th>
                <th className="p-2.5 border-r border-gray-200 font-medium min-w-[100px]">
                  口座番号 <span className="text-red-500">*</span>
                </th>
                <th className="p-2.5 border-r border-gray-200 font-medium min-w-[180px]">
                  受取人名（半角カナ自動変換） <span className="text-red-500">*</span>
                </th>
                <th className="p-2.5 border-r border-gray-200 font-medium min-w-[110px] text-right">
                  振込金額 (円) <span className="text-red-500">*</span>
                </th>
                <th className="p-2.5 text-center w-16 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => {
                const isSelected = selectedIds.includes(item.id);
                const isBeingDragged = draggedIds.includes(item.id);
                const isDropTargetBefore = dropTarget?.id === item.id && dropTarget?.position === 'before';
                const isDropTargetAfter = dropTarget?.id === item.id && dropTarget?.position === 'after';

                return (
                  <tr
                    key={item.id}
                    onDragOver={(e) => handleDragOver(e, item.id)}
                    onDrop={(e) => handleDrop(e, item.id)}
                    className={`transition-colors relative group ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/70'
                    } ${isBeingDragged ? 'opacity-30 bg-blue-100' : ''} ${
                      isDropTargetBefore ? 'border-t-2 border-t-blue-500' : ''
                    } ${isDropTargetAfter ? 'border-b-2 border-b-blue-500' : ''}`}
                  >
                    {/* ドラッグハンドル ＆ 選択チェックボックス */}
                    <td className="p-2 border-r border-gray-100 text-center select-none bg-gray-50/30">
                      <div className="flex items-center justify-center space-x-1">
                        <div
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          onDragEnd={handleDragEnd}
                          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-blue-600 p-0.5 rounded transition"
                          title="ドラッグして行を移動（複数選択時はまとめて移動）"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const nativeEvent = e.nativeEvent as MouseEvent;
                            handleToggleSelect(item.id, nativeEvent.shiftKey);
                          }}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </td>

                    {/* 行番号 */}
                    <td className="p-2 border-r border-gray-100 text-center text-gray-400 font-mono">
                      {index + 1}
                    </td>

                    {/* 銀行コード */}
                    <td className="p-1.5 border-r border-gray-100">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="0005"
                        value={item.bankCode}
                        onChange={(e) => handleItemChange(index, 'bankCode', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none"
                      />
                    </td>

                    {/* 銀行名 */}
                    <td className="p-1.5 border-r border-gray-100">
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="ﾐﾂﾋﾞｼUFJ"
                        value={item.bankName}
                        onChange={(e) => handleItemChange(index, 'bankName', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none"
                      />
                    </td>

                    {/* 支店コード */}
                    <td className="p-1.5 border-r border-gray-100">
                      <input
                        type="text"
                        maxLength={3}
                        placeholder="110"
                        value={item.branchCode}
                        onChange={(e) => handleItemChange(index, 'branchCode', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none"
                      />
                    </td>

                    {/* 支店名 */}
                    <td className="p-1.5 border-r border-gray-100">
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="ﾎﾝﾃﾝ"
                        value={item.branchName}
                        onChange={(e) => handleItemChange(index, 'branchName', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none"
                      />
                    </td>

                    {/* 口座種目 */}
                    <td className="p-1.5 border-r border-gray-100">
                      <select
                        value={item.accountType}
                        onChange={(e) => handleItemChange(index, 'accountType', e.target.value as AccountType)}
                        className="w-full px-1.5 py-1 text-xs border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none"
                      >
                        {ACCOUNT_TYPES.map((t) => (
                          <option key={t.code} value={t.code}>{t.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* 口座番号 */}
                    <td className="p-1.5 border-r border-gray-100">
                      <input
                        type="text"
                        maxLength={7}
                        placeholder="1234567"
                        value={item.accountNumber}
                        onChange={(e) => handleItemChange(index, 'accountNumber', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none"
                      />
                    </td>

                    {/* 受取人名 */}
                    <td className="p-1.5 border-r border-gray-100">
                      <input
                        type="text"
                        maxLength={30}
                        placeholder="ｶ) ｻﾝﾌﾟﾙｼｮｳｼﾞ"
                        value={item.recipientName}
                        onChange={(e) => handleItemChange(index, 'recipientName', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none"
                      />
                    </td>

                    {/* 振込金額 */}
                    <td className="p-1.5 border-r border-gray-100 text-right">
                      <input
                        type="text"
                        placeholder="0"
                        value={item.amount ? item.amount.toLocaleString() : ''}
                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono text-right border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none"
                      />
                    </td>

                    {/* アクション */}
                    <td className="p-1.5 text-center">
                      <div className="flex items-center justify-center space-x-1 opacity-70 group-hover:opacity-100">
                        <button
                          onClick={() => handleDuplicateItem(index)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
                          title="行を複製"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(index)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                          title="行を削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* テーブル下部バー */}
        <div className="p-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between text-xs">
          <button
            onClick={handleAddItem}
            className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新しい行を追加する</span>
          </button>

          <div className="flex items-center space-x-6 text-gray-700">
            <div>
              <span>件数: </span>
              <strong className="font-semibold text-gray-900">{items.length} 件</strong>
            </div>
            <div>
              <span>合計振込額: </span>
              <strong className="font-semibold text-base text-gray-900">
                ¥{totalAmount.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* フッターアクション */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="notion-btn-secondary text-sm"
        >
          キャンセル
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
  );
};
