import React, { useState, useMemo, useCallback } from 'react';
import {
  Trophy,
  Medal,
  ExternalLink,
  RefreshCw,
  Search,
  Users,
  Radio,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code2,
  Calendar,
  ArrowUpDown,
  TrendingUp,
  Crown,
  Lock,
} from 'lucide-react';
import {
  ShowroomRankingItem,
  ShowroomGiftRankingResponse,
  ScoreHistorySnapshot,
} from './types';
import { ScoreTrendChart } from './components/ScoreTrendChart';
import { FinalPodium } from './components/FinalPodium';
import { FINAL_CONFIRMED_DATA, FINAL_HISTORY_DATA } from './data/finalArchive';

type SortField = 'rank' | 'score-desc' | 'score-asc' | 'followers' | 'name';

export default function App() {
  // Use final archived data as initial state for instant, rock-solid rendering
  const [data, setData] = useState<ShowroomGiftRankingResponse>(
    FINAL_CONFIRMED_DATA.data as unknown as ShowroomGiftRankingResponse
  );
  const [history, setHistory] = useState<ScoreHistorySnapshot[]>(
    FINAL_HISTORY_DATA as unknown as ScoreHistorySnapshot[]
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(
    new Date('2026-09-24T22:01:00+09:00')
  );
  const [showChart, setShowChart] = useState<boolean>(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('rank');
  const [liveOnly, setLiveOnly] = useState<boolean>(false);

  // Expanded descriptions
  const [expandedRooms, setExpandedRooms] = useState<Record<number, boolean>>({});
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Re-fetch final data from backend if needed
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ranking?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      }
      const histRes = await fetch(`/api/history?_t=${Date.now()}`);
      if (histRes.ok) {
        const histJson = await histRes.json();
        if (Array.isArray(histJson.history)) {
          setHistory(histJson.history);
        }
      }
      setLastUpdated(new Date('2026-09-24T22:01:00+09:00'));
    } catch (err) {
      console.warn('Backend fetch error, using statically embedded final data:', err);
      setData(FINAL_CONFIRMED_DATA.data as unknown as ShowroomGiftRankingResponse);
      setHistory(FINAL_HISTORY_DATA as unknown as ScoreHistorySnapshot[]);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleExpandRoom = (roomId: number) => {
    setExpandedRooms((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  const handleCopyJson = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Sorted by rank lookup
  const sortedByRank = useMemo(() => {
    if (!data?.ranking_list) return [];
    return [...data.ranking_list].sort((a, b) => a.rank - b.rank);
  }, [data]);

  // First place score for diff calculations
  const firstPlaceScore = useMemo(() => {
    if (sortedByRank.length === 0) return 0;
    return sortedByRank[0].score;
  }, [sortedByRank]);

  // Filtered and sorted list
  const filteredAndSortedList = useMemo(() => {
    if (!data?.ranking_list) return [];

    let list = [...data.ranking_list];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.room.name.toLowerCase().includes(q) ||
          item.room.url_key.toLowerCase().includes(q) ||
          item.room.description?.toLowerCase().includes(q)
      );
    }

    if (liveOnly) {
      list = list.filter((item) => item.room.is_live);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return a.rank - b.rank;
        case 'score-desc':
          return b.score - a.score;
        case 'score-asc':
          return a.score - b.score;
        case 'followers':
          return b.room.follower_num - a.room.follower_num;
        case 'name':
          return a.room.name.localeCompare(b.room.name, 'ja');
        default:
          return a.rank - b.rank;
      }
    });

    return list;
  }, [data, searchQuery, liveOnly, sortBy]);

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Navigation Header */}
      <header id="main-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br from-amber-500 to-yellow-600">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">SHOWROOM ギフトランキング</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  <Trophy className="w-3 h-3 text-amber-600" />
                  最終結果 (確定)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                  確定日時: 2026/09/24 22:01 (JST)
                </span>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.2 rounded border border-slate-200">
                  外部API停止・DB削除完了
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            <button
              id="toggle-chart-btn"
              type="button"
              onClick={() => setShowChart((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                showChart
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              推移グラフ {showChart ? '表示中' : '非表示'}
            </button>

            <button
              id="refresh-btn"
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              確定データ再読込
            </button>

            {/* Frozen Status Lock Badge */}
            <div
              id="auto-refresh-frozen-badge"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-slate-100 text-slate-600 border-slate-200 shadow-2xs select-none"
              title="イベントは22:01に確定し、外部API通信およびDBは完全停止・削除済みです"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>更新停止 (確定済)</span>
            </div>

            <button
              id="view-json-btn"
              type="button"
              onClick={() => setShowJsonModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              title="確定JSONデータを確認"
            >
              <Code2 className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Final Result Podium */}
        {sortedByRank.length > 0 && (
          <FinalPodium topItems={sortedByRank} />
        )}

        {/* Score Trend Line Chart (Full-stack integrated with 1v2 and 3v4 match comparison) */}
        {showChart && (
          <ScoreTrendChart
            history={history}
            rankingList={sortedByRank}
            lastUpdated={lastUpdated}
            currentUnchangedMinutes={0}
            isFinalResult={true}
          />
        )}

        {/* Filter and Sort Toolbar */}
        <section id="filter-toolbar" className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="room-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ルーム名やキーワードで絞り込み..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live Filter */}
            <button
              id="live-filter-btn"
              type="button"
              onClick={() => setLiveOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                liveOnly
                  ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${liveOnly ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
              配信中のみ
            </button>

            {/* Sort Select */}
            <div className="relative inline-flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="pl-8 pr-7 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg appearance-none text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value="rank">順位 (昇順)</option>
                <option value="score-desc">スコア (高い順)</option>
                <option value="score-asc">スコア (低い順)</option>
                <option value="followers">フォロワー数 (多い順)</option>
                <option value="name">ルーム名 (五十音順)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Total Score Summary Cards */}
        <section id="stats-summary" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">イベント総獲得スコア (最終確定)</div>
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                {data.total_score.toLocaleString()} <span className="text-xs font-normal text-slate-500">pt</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">参加ルーム数</div>
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                {data.ranking_list.length} <span className="text-xs font-normal text-slate-500">ルーム</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Medal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">優勝（第1位獲得スコア）</div>
              <div className="text-xl font-extrabold text-amber-600 tracking-tight">
                {firstPlaceScore.toLocaleString()} <span className="text-xs font-normal text-slate-500">pt</span>
              </div>
            </div>
          </div>
        </section>

        {/* Ranking List */}
        <section id="ranking-list-section" className="space-y-3">
          {filteredAndSortedList.map((item) => {
            const isTop3 = item.rank <= 3;
            const diffFromFirst = firstPlaceScore - item.score;
            const isExpanded = !!expandedRooms[item.room_id];

            return (
              <div
                key={item.room_id}
                id={`room-card-${item.room_id}`}
                className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md ${
                  item.rank === 1
                    ? 'border-amber-400 ring-2 ring-amber-300/40 shadow-xs'
                    : item.rank === 2
                    ? 'border-slate-300 shadow-2xs'
                    : item.rank === 3
                    ? 'border-amber-600/40 shadow-2xs'
                    : 'border-slate-200 shadow-2xs'
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Rank, Avatar, Name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Badge */}
                      <div className="shrink-0 flex items-center justify-center w-9 sm:w-11">
                        {item.rank === 1 ? (
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black flex items-center justify-center text-base sm:text-lg shadow-sm border border-amber-300">
                            1
                          </div>
                        ) : item.rank === 2 ? (
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-800 font-black flex items-center justify-center text-base sm:text-lg shadow-sm border border-slate-300">
                            2
                          </div>
                        ) : item.rank === 3 ? (
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black flex items-center justify-center text-base sm:text-lg shadow-sm border border-amber-800">
                            3
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm border border-slate-200">
                            {item.rank}
                          </div>
                        )}
                      </div>

                      {/* Room Avatar */}
                      <div className="relative shrink-0">
                        <img
                          src={item.room.image_url}
                          alt={item.room.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shadow-2xs"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        {item.room.is_live && (
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white items-center justify-center">
                              <Radio className="w-2 h-2 text-white" />
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Room Name & Meta */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            最終順位: {item.rank}位 確定
                          </span>
                          {isTop3 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              <Trophy className="w-2.5 h-2.5" />
                              入賞
                            </span>
                          )}
                          {item.room.is_live && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-rose-600 px-1.5 py-0.2 rounded shadow-2xs">
                              <Radio className="w-2.5 h-2.5" />
                              LIVE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                            {item.room.name}
                          </h2>
                          <a
                            href={`https://www.showroom-live.com/r/${item.room.url_key}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                            title="SHOWROOMで開く"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {item.room.follower_num.toLocaleString()} フォロワー
                          </span>
                          <span>•</span>
                          <span className="text-slate-400 font-mono text-[11px]">ID: {item.room_id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Score and Diff from 1st place */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right space-y-1">
                        <div>
                          <div className="flex items-center sm:justify-end gap-1.5 text-xs font-semibold text-slate-500">
                            <span>最終確定スコア</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 sm:justify-end">
                            <span
                              className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                                item.rank === 1
                                  ? 'text-amber-600 font-black'
                                  : isTop3
                                  ? 'text-slate-900 font-black'
                                  : 'text-slate-800'
                              }`}
                            >
                              {item.score.toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">pt</span>
                          </div>
                        </div>

                        {/* Diff from 1st place */}
                        {item.rank > 1 && (
                          <div className="text-xs font-medium text-slate-500 flex items-center gap-1 sm:justify-end">
                            <span className="text-slate-400">1位と</span>
                            <span className="font-mono text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                              -{diffFromFirst.toLocaleString()} pt
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expand / Details Toggle */}
                      {item.room.description && (
                        <button
                          type="button"
                          onClick={() => toggleExpandRoom(item.room_id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title={isExpanded ? '詳細を閉じる' : '詳細を表示'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Room Description */}
                  {isExpanded && item.room.description && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-lg whitespace-pre-line">
                      {item.room.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredAndSortedList.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-200 shadow-2xs">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">該当するルームが見つかりませんでした</p>
              <p className="text-xs text-slate-500 mt-1">検索条件を変更してお試しください。</p>
            </div>
          )}
        </section>
      </main>

      {/* Raw JSON Modal */}
      {showJsonModal && data && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">最終確定データ (JSON)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedJson ? 'コピー完了' : 'コピー'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowJsonModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-900 text-emerald-400 font-mono text-xs rounded-b-2xl">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
