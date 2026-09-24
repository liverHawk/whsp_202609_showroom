import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, Clock, Check, Eye, Timer, ZoomIn, Swords, Flame, Trophy, Users } from 'lucide-react';
import { ScoreHistorySnapshot, ShowroomRankingItem } from '../types';

interface ScoreTrendChartProps {
  history: ScoreHistorySnapshot[];
  rankingList: ShowroomRankingItem[];
  lastUpdated: Date | null;
  currentUnchangedMinutes?: number;
  isFinalResult?: boolean;
}

const ROOM_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#e11d48', // Rose
  '#64748b', // Slate
];

function formatJST(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({
  history,
  rankingList,
  lastUpdated,
  currentUnchangedMinutes = 1,
  isFinalResult = false,
}) => {
  // Select active rooms to display in chart
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>(() => {
    return rankingList.slice(0, 5).map((r) => r.room_id);
  });

  const [timeWindow, setTimeWindow] = useState<'all' | '15m' | '30m' | '60m'>('all');

  // Room color mapping
  const roomColorMap = useMemo(() => {
    const map: Record<number, string> = {};
    rankingList.forEach((item, index) => {
      map[item.room_id] = ROOM_COLORS[index % ROOM_COLORS.length];
    });
    return map;
  }, [rankingList]);

  // Transform history data for Recharts as clean linear trend
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    const now = Date.now();
    const dataPoints: Array<Record<string, string | number>> = [];

    // Filter by time window first
    let windowSnapshots = history;
    if (timeWindow === '15m') {
      windowSnapshots = history.filter((p) => now - p.timestamp <= 15 * 60 * 1000);
    } else if (timeWindow === '30m') {
      windowSnapshots = history.filter((p) => now - p.timestamp <= 30 * 60 * 1000);
    } else if (timeWindow === '60m') {
      windowSnapshots = history.filter((p) => now - p.timestamp <= 60 * 60 * 1000);
    }

    if (windowSnapshots.length === 0 && history.length > 0) {
      windowSnapshots = [history[history.length - 1]];
    }

    // Sort snapshots chronologically
    const sorted = [...windowSnapshots].sort((a, b) => a.timestamp - b.timestamp);

    // Group/deduplicate by unique timeLabel or minute
    const seenTimes = new Set<string>();
    sorted.forEach((snapshot, idx) => {
      const timeStr = snapshot.timeLabel || formatJST(snapshot.timestamp);
      // Avoid duplicate consecutive identical time labels unless it is the last item
      if (seenTimes.has(timeStr) && idx < sorted.length - 1) {
        return;
      }
      seenTimes.add(timeStr);

      const entry: Record<string, string | number> = {
        time: timeStr,
        timestamp: snapshot.timestamp,
        unchangedMinutes: snapshot.unchangedMinutes || 1,
      };

      rankingList.forEach((item) => {
        const score = snapshot.scores[item.room_id];
        if (score !== undefined) {
          entry[`room_${item.room_id}`] = score;
        }
      });

      dataPoints.push(entry);
    });

    // If the latest snapshot is older than 1 minute, append a latest point at current time to show flat ongoing score
    if (dataPoints.length > 0) {
      const lastPoint = dataPoints[dataPoints.length - 1];
      const lastTs = Number(lastPoint.timestamp);
      const currentTimeLabel = formatJST(now);

      if (now - lastTs >= 60000 && lastPoint.time !== currentTimeLabel) {
        const currentPoint: Record<string, string | number> = {
          time: currentTimeLabel,
          timestamp: now,
          unchangedMinutes: Math.max(1, Math.round((now - lastTs) / 60000)),
        };

        rankingList.forEach((item) => {
          const score = lastPoint[`room_${item.room_id}`];
          if (score !== undefined) {
            currentPoint[`room_${item.room_id}`] = score;
          }
        });

        dataPoints.push(currentPoint);
      }
    }

    return dataPoints;
  }, [history, rankingList, timeWindow]);

  // Zoom mode: true by default (auto-scales Y-axis to highlight subtle point variations)
  const [zoomYAxis, setZoomYAxis] = useState<boolean>(true);

  // Check if all selected rooms have zero variation across all visible points
  const hasScoreVariation = useMemo(() => {
    if (chartData.length <= 1) return false;
    for (const roomId of selectedRoomIds) {
      const firstVal = chartData[0][`room_${roomId}`];
      for (let i = 1; i < chartData.length; i++) {
        if (chartData[i][`room_${roomId}`] !== firstVal) {
          return true;
        }
      }
    }
    return false;
  }, [chartData, selectedRoomIds]);

  // Calculate dynamic Y-axis domain based on currently selected rooms and visible data
  const yDomain = useMemo(() => {
    if (!zoomYAxis) {
      return [0, 'auto'];
    }

    let min = Infinity;
    let max = -Infinity;

    chartData.forEach((point) => {
      selectedRoomIds.forEach((roomId) => {
        const val = point[`room_${roomId}`];
        if (typeof val === 'number') {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      });
    });

    if (min === Infinity || max === -Infinity) {
      return ['auto', 'auto'];
    }

    const span = max - min;
    // If scores have zero variation across selected rooms, provide balanced margins so line is completely flat and centered
    const padding =
      span === 0
        ? Math.max(2000, Math.round(max * 0.05))
        : Math.max(300, Math.round(span * 0.08));

    const lowerBound = Math.max(0, Math.floor((min - padding) / 100) * 100);
    const upperBound = Math.ceil((max + padding) / 100) * 100;

    return [lowerBound, upperBound];
  }, [chartData, selectedRoomIds, zoomYAxis]);

  const toggleRoom = (roomId: number) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const selectAll = () => {
    setSelectedRoomIds(rankingList.map((r) => r.room_id));
  };

  const selectTop3 = () => {
    setSelectedRoomIds(rankingList.slice(0, 3).map((r) => r.room_id));
  };

  // Find rank items for 1st, 2nd, 3rd, 4th
  const rank1Item = useMemo(() => rankingList.find((r) => r.rank === 1), [rankingList]);
  const rank2Item = useMemo(() => rankingList.find((r) => r.rank === 2), [rankingList]);
  const rank3Item = useMemo(() => rankingList.find((r) => r.rank === 3), [rankingList]);
  const rank4Item = useMemo(() => rankingList.find((r) => r.rank === 4), [rankingList]);

  // Determine if 1v2 or 3v4 is currently isolated/selected
  const is1v2Selected = useMemo(() => {
    if (!rank1Item || !rank2Item) return false;
    return (
      selectedRoomIds.length === 2 &&
      selectedRoomIds.includes(rank1Item.room_id) &&
      selectedRoomIds.includes(rank2Item.room_id)
    );
  }, [selectedRoomIds, rank1Item, rank2Item]);

  const is3v4Selected = useMemo(() => {
    if (!rank3Item || !rank4Item) return false;
    return (
      selectedRoomIds.length === 2 &&
      selectedRoomIds.includes(rank3Item.room_id) &&
      selectedRoomIds.includes(rank4Item.room_id)
    );
  }, [selectedRoomIds, rank3Item, rank4Item]);

  // Active VS match metadata
  const activeVsPair = useMemo(() => {
    if (is1v2Selected && rank1Item && rank2Item) {
      return {
        title: '1位 vs 2位 （首位攻防戦）',
        itemA: rank1Item,
        itemB: rank2Item,
        diff: rank1Item.score - rank2Item.score,
        type: '1v2' as const,
      };
    }
    if (is3v4Selected && rank3Item && rank4Item) {
      return {
        title: '3位 vs 4位 （表彰台ボーダー攻防戦）',
        itemA: rank3Item,
        itemB: rank4Item,
        diff: rank3Item.score - rank4Item.score,
        type: '3v4' as const,
      };
    }
    return null;
  }, [is1v2Selected, is3v4Selected, rank1Item, rank2Item, rank3Item, rank4Item]);

  const select1v2 = () => {
    if (rank1Item && rank2Item) {
      setSelectedRoomIds([rank1Item.room_id, rank2Item.room_id]);
      setZoomYAxis(true);
    }
  };

  const select3v4 = () => {
    if (rank3Item && rank4Item) {
      setSelectedRoomIds([rank3Item.room_id, rank4Item.room_id]);
      setZoomYAxis(true);
    }
  };

  const latestSnapshot = history[history.length - 1];
  const unchangedMin = latestSnapshot?.unchangedMinutes || currentUnchangedMinutes;

  return (
    <section id="score-trend-chart-section" className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">スコア推移グラフ</h2>
              {isFinalResult && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  最終確定推移
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                折れ線型 (JST)
              </span>
              {!hasScoreVariation ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  期間中スコア変動なし（水平維持中）
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ポイント変動あり
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1 font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                <Timer className="w-3 h-3" />
                現在同一スコア継続: {unchangedMin}分間
              </span>
              <span>•</span>
              <span>変動ポイント数: {history.length} 箇所</span>
              {lastUpdated && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    最新確認: {lastUpdated.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })} (JST)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom mode toggle (Default: ON) */}
          <button
            type="button"
            onClick={() => setZoomYAxis((prev) => !prev)}
            title={zoomYAxis ? '下限0の全体表示に切り替え' : '変動が見やすい拡大表示に切り替え'}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              zoomYAxis
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5 text-indigo-600" />
            {zoomYAxis ? '変動拡大: ON' : '0起点'}
          </button>

          {/* Time window filters */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="text-slate-400 px-2 font-medium">期間:</span>
            {(['all', '15m', '30m', '60m'] as const).map((win) => {
              const labels = {
                all: 'すべて',
                '15m': '直近15分',
                '30m': '直近30分',
                '60m': '直近1時間',
              };
              return (
                <button
                  key={win}
                  type="button"
                  onClick={() => setTimeWindow(win)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    timeWindow === win
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labels[win]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Room Filters & VS Comparison Mode */}
      <div className="space-y-2.5 pt-1">
        {/* Preset quick buttons: All, Top3, 1st vs 2nd, 3rd vs 4th */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            表示対象:
          </div>

          {/* 1st vs 2nd Match Preset */}
          <button
            id="vs-1v2-btn"
            type="button"
            onClick={select1v2}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              is1v2Selected
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm ring-2 ring-amber-300'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>1位 vs 2位</span>
            <span className="text-[10px] opacity-80 font-normal">（首位攻防）</span>
          </button>

          {/* 3rd vs 4th Match Preset */}
          <button
            id="vs-3v4-btn"
            type="button"
            onClick={select3v4}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              is3v4Selected
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm ring-2 ring-indigo-300'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-indigo-400" />
            <span>3位 vs 4位</span>
            <span className="text-[10px] opacity-80 font-normal">（表彰台争い）</span>
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={selectTop3}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border ${
              selectedRoomIds.length === 3 &&
              rankingList.slice(0, 3).every((r) => selectedRoomIds.includes(r.room_id))
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            上位3名
          </button>

          <button
            type="button"
            onClick={selectAll}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border ${
              selectedRoomIds.length === rankingList.length
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            全員
          </button>
        </div>

        {/* Individual Room Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {rankingList.map((item) => {
            const isSelected = selectedRoomIds.includes(item.room_id);
            const color = roomColorMap[item.room_id] || '#64748b';
            const shortName = item.room.name.replace(/（.*）|\(.*?\)/g, '').trim();

            return (
              <button
                key={item.room_id}
                type="button"
                onClick={() => toggleRoom(item.room_id)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 hover:opacity-100'
                }`}
                style={{
                  borderColor: isSelected ? color : '#e2e8f0',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-semibold text-slate-500 mr-0.5">{item.rank}位</span>
                <span className="truncate max-w-[85px]">{shortName}</span>
                {isSelected && <Check className="w-2.5 h-2.5 text-slate-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* VS Head-to-Head Status Banner (Visible when 1v2 or 3v4 comparison is active) */}
      {activeVsPair && (
        <div
          id="vs-head-to-head-banner"
          className={`rounded-xl p-3 sm:p-4 border transition-all ${
            activeVsPair.type === '1v2'
              ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/80 border-amber-300 shadow-2xs'
              : 'bg-gradient-to-r from-indigo-50 via-white to-purple-50/80 border-indigo-200 shadow-2xs'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Player A */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative shrink-0">
                <img
                  src={activeVsPair.itemA.room.image_url}
                  alt={activeVsPair.itemA.room.name}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span
                  className={`absolute -top-1 -left-1 px-1.5 py-0.2 rounded text-[10px] font-black text-white ${
                    activeVsPair.itemA.rank === 1 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                >
                  {activeVsPair.itemA.rank}位
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                  {activeVsPair.itemA.room.name}
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
                  {activeVsPair.itemA.score.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500 ml-1">pt</span>
                </div>
              </div>
            </div>

            {/* VS Center Badge with Point Difference */}
            <div className="flex flex-col items-center justify-center shrink-0 px-4 py-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1 text-[11px] font-black tracking-wider text-rose-600">
                <Swords className="w-3.5 h-3.5" />
                <span>VS</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                ポイント差: <span className="text-rose-600 font-extrabold">{Math.abs(activeVsPair.diff).toLocaleString()}</span> pt
              </div>
              <div className="text-[10px] text-slate-500">
                {activeVsPair.diff > 0
                  ? `${activeVsPair.itemA.room.name.slice(0, 8)} が ${activeVsPair.diff.toLocaleString()}pt リード`
                  : activeVsPair.diff < 0
                  ? `${activeVsPair.itemB.room.name.slice(0, 8)} が ${Math.abs(activeVsPair.diff).toLocaleString()}pt リード`
                  : '同点'}
              </div>
            </div>

            {/* Player B */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="text-right min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                  {activeVsPair.itemB.room.name}
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
                  {activeVsPair.itemB.score.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500 ml-1">pt</span>
                </div>
              </div>
              <div className="relative shrink-0">
                <img
                  src={activeVsPair.itemB.room.image_url}
                  alt={activeVsPair.itemB.room.name}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span
                  className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded text-[10px] font-black text-white ${
                    activeVsPair.itemB.rank === 2 ? 'bg-slate-500' : 'bg-purple-600'
                  }`}
                >
                  {activeVsPair.itemB.rank}位
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="w-full h-80 pt-2">
        {chartData.length < 2 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
            <TrendingUp className="w-8 h-8 text-indigo-400 mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-slate-700">スコア監視中 (JST)</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              値が変わらない間は重複保存せず、現在のスコアの継続時間をカウントしています（現在: {unchangedMin}分間継続中）。
              スコア変動時、または時間の経過とともにグラフに線が描画されます。
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 25, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                domain={yDomain as any}
                allowDataOverflow={true}
                width={70}
                tickFormatter={(val: number) => {
                  if (typeof yDomain[0] === 'number' && typeof yDomain[1] === 'number') {
                    const span = yDomain[1] - yDomain[0];
                    if (span <= 20000) {
                      return val.toLocaleString();
                    }
                  }
                  if (val >= 10000) {
                    const manVal = val / 10000;
                    return `${manVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}万`;
                  }
                  return val.toLocaleString();
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const firstPayload = payload[0]?.payload;
                  const duration = firstPayload?.unchangedMinutes;
                  const durationText = duration && duration > 1 ? ` (${duration}分間継続中)` : '';

                  let vsDiffElement = null;
                  if (activeVsPair && payload.length >= 2) {
                    const valA = Number(firstPayload[`room_${activeVsPair.itemA.room_id}`] ?? 0);
                    const valB = Number(firstPayload[`room_${activeVsPair.itemB.room_id}`] ?? 0);
                    const diff = Math.abs(valA - valB);
                    const leader = valA >= valB ? activeVsPair.itemA.room.name.slice(0, 8) : activeVsPair.itemB.room.name.slice(0, 8);
                    vsDiffElement = (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
                        <span>ポイント差:</span>
                        <span>{diff.toLocaleString()} pt ({leader}リード)</span>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 border border-slate-200 shadow-md text-xs space-y-1.5 min-w-[210px]">
                      <div className="font-semibold text-slate-700 pb-1 border-b border-slate-100">
                        時刻: {label} (JST){durationText}
                      </div>
                      {payload.map((entry: any) => {
                        const roomId = parseInt(String(entry.dataKey).replace('room_', ''), 10);
                        const roomItem = rankingList.find((r) => r.room_id === roomId);
                        const displayName = roomItem
                          ? roomItem.room.name.replace(/（.*）|\(.*?\)/g, '').trim()
                          : entry.name;
                        return (
                          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                            <span
                              className="flex items-center gap-1.5 truncate max-w-[130px]"
                              style={{ color: entry.color }}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: entry.color }}
                              />
                              {roomItem ? `${roomItem.rank}位 ` : ''}
                              {displayName}
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                              {Number(entry.value).toLocaleString()} pt
                            </span>
                          </div>
                        );
                      })}
                      {vsDiffElement}
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value: string) => {
                  const roomId = parseInt(value.replace('room_', ''), 10);
                  const roomItem = rankingList.find((r) => r.room_id === roomId);
                  return roomItem
                    ? roomItem.room.name.replace(/（.*）|\(.*?\)/g, '').trim()
                    : value;
                }}
              />
              {rankingList
                .filter((item) => selectedRoomIds.includes(item.room_id))
                .map((item) => (
                  <Line
                    key={item.room_id}
                    type="linear"
                    dataKey={`room_${item.room_id}`}
                    name={`room_${item.room_id}`}
                    stroke={roomColorMap[item.room_id] || '#6366f1'}
                    strokeWidth={item.rank === 1 ? 3 : 2}
                    dot={{ r: 3.5, fill: roomColorMap[item.room_id] || '#6366f1' }}
                    activeDot={{ r: 6 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};
