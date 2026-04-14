import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Filter,
  LoaderCircle,
  MapPin,
  Mic,
  Pause,
  Phone,
  Play,
  Radio,
  RefreshCw,
  Search,
  Send,
  Square,
  Type,
  Users,
  Volume2,
  XCircle,
} from 'lucide-react';

import { getApiUrl } from '../src/api/config';
import { deviceApi, type ApiDevice } from '../src/api/deviceApi';

type ActiveTab = 'tts' | 'records';
type SendMode = 'group' | 'broadcast';
type RecordStatus = 'success' | 'partial' | 'failed';

interface Jt808Device extends ApiDevice {
  phone: string;
}

interface TtsSendItem {
  phone: string;
  success: boolean;
  message: string;
  device_name: string;
  sequence?: number;
}

interface TtsSendResponse {
  requested_count: number;
  success_count: number;
  failed_count: number;
  results: TtsSendItem[];
}

interface SendRecord {
  id: string;
  createdAt: string;
  mode: SendMode;
  text: string;
  result: TtsSendResponse;
  targetNames: string[];
}

const MAX_HISTORY = 30;

function isJt808Device(device: ApiDevice) {
  const type = String(device.device_type || '').toUpperCase();
  return type === 'JT808' || type.includes('JT808');
}

function getPhoneFromDevice(device: ApiDevice) {
  const streamPhone = typeof device.stream_url === 'string' ? device.stream_url.trim() : '';
  return streamPhone || String(device.id || '').trim();
}

function getRecordStatus(result: TtsSendResponse): RecordStatus {
  if (result.success_count === 0) {
    return 'failed';
  }
  if (result.failed_count > 0) {
    return 'partial';
  }
  return 'success';
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

const companyTree = [
  {
    id: '中铁一局',
    name: '中铁一局',
    projects: [
      { id: '西安地铁8号线', name: '西安地铁8号线', teams: ['施工一组', '施工二组', '施工三组'] }
    ]
  },
  {
    id: '中铁隧道局',
    name: '中铁隧道局',
    projects: [
      { id: '深圳地铁14号线', name: '深圳地铁14号线', teams: ['盾构一组', '盾构二组'] },
      { id: '广州地铁18号线', name: '广州地铁18号线', teams: ['土建一队', '土建二队'] }
    ]
  },
];

function summarizeError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (detail && typeof detail === 'object') {
    const result = detail as Partial<TtsSendResponse> & { message?: string };
    if (typeof result.message === 'string') {
      return result.message;
    }
    if (typeof result.failed_count === 'number' && typeof result.requested_count === 'number') {
      return `发送失败，${result.failed_count}/${result.requested_count} 台设备未成功接收`;
    }
  }

  return fallback;
}

export default function GroupCall() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tts');
  const [sendMode, setSendMode] = useState<SendMode>('group');
  const [devices, setDevices] = useState<Jt808Device[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [ttsText, setTtsText] = useState('');
  const [sendRecords, setSendRecords] = useState<SendRecord[]>([]);
  const [latestResult, setLatestResult] = useState<TtsSendResponse | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingError, setLoadingError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedText, setRecordedText] = useState('');

  const loadDevices = async () => {
    setLoadingDevices(true);
    setLoadingError('');

    try {
      const response = await deviceApi.getAllDevices();
      const jt808Devices = response
        .filter(isJt808Device)
        .map((device) => ({
          ...device,
          phone: getPhoneFromDevice(device),
        }))
        .filter((device) => device.phone)
        .sort((a, b) => {
          if (a.is_online !== b.is_online) {
            return a.is_online ? -1 : 1;
          }
          return a.device_name.localeCompare(b.device_name, 'zh-CN');
        });

      setDevices(jt808Devices);
      setSelectedPhones((prev) => prev.filter((phone) => jt808Devices.some((device) => device.phone === phone)));
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载 终端设备失败';
      setLoadingError(message);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const resetFilters = () => {
    setSelectedCompany('all');
    setSelectedProject('all');
    setSelectedTeam('all');
    setSearchKeyword('');
    setShowFilter(false);
  };

  const activeFiltersCount = [
    selectedCompany !== 'all',
    selectedProject !== 'all',
    selectedTeam !== 'all',
    searchKeyword !== ''
  ].filter(Boolean).length;

  const filteredDevices = devices.filter((device) => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (keyword) {
      const searchable = [device.device_name, device.phone, device.id, device.device_type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(keyword)) {
        return false;
      }
    }

    if (selectedCompany !== 'all') {
      const company = companyTree.find(c => c.id === selectedCompany);
      if (company) {
        if (selectedProject !== 'all') {
          const project = company.projects.find((p: any) => p.id === selectedProject);
          if (project) {
            if (selectedTeam !== 'all') {
              const deviceName = (device.device_name || '').toLowerCase();
              if (!deviceName.includes(selectedTeam.toLowerCase())) {
                return false;
              }
            }
            const deviceName = (device.device_name || '').toLowerCase();
            if (!deviceName.includes(project.name.toLowerCase())) {
              return false;
            }
          }
        }
        const deviceName = (device.device_name || '').toLowerCase();
        if (!deviceName.includes(company.name.toLowerCase())) {
          return false;
        }
      }
    }

    return true;
  });

  const selectedDevices = devices.filter((device) => selectedPhones.includes(device.phone));
  const onlineDevices = devices.filter((device) => device.is_online);
  const targetDevices = sendMode === 'broadcast' ? onlineDevices : selectedDevices;
  const targetPhones = targetDevices.map((device) => device.phone);

  const togglePhoneSelection = (phone: string) => {
    setSelectedPhones((prev) =>
      prev.includes(phone) ? prev.filter((item) => item !== phone) : [...prev, phone]
    );
  };

  const selectAllOnline = () => {
    setSelectedPhones(onlineDevices.map((device) => device.phone));
  };

  const clearSelection = () => {
    setSelectedPhones([]);
  };

  const sendTts = async () => {
    const text = ttsText.trim();
    if (!text) {
      setSendError('请输入要播报的文本');
      return;
    }

    if (targetPhones.length === 0) {
      setSendError(sendMode === 'broadcast' ? '当前没有在线 终端设备可广播' : '请至少选择一台 终端设备');
      return;
    }

    setSending(true);
    setSendError('');

    try {
      const response = await fetch(getApiUrl('/call/tts/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          target_phones: targetPhones,
        }),
      });

      const payload = (await response.json().catch(() => null)) as TtsSendResponse | { detail?: unknown } | null;
      if (!response.ok || !payload || !('results' in payload)) {
        throw new Error(summarizeError(payload, '文本播报发送失败'));
      }

      const result = payload as TtsSendResponse;
      setLatestResult(result);
      setSendRecords((prev) => [
        {
          id: `${Date.now()}`,
          createdAt: new Date().toISOString(),
          mode: sendMode,
          text,
          result,
          targetNames: targetDevices.map((device) => device.device_name || device.phone),
        },
        ...prev,
      ].slice(0, MAX_HISTORY));

      if (result.success_count > 0) {
        setTtsText('');
      }

      await loadDevices();
    } catch (error) {
      const message = error instanceof Error ? error.message : '文本播报发送失败';
      setSendError(message);
    } finally {
      setSending(false);
    }
  };

  const successRecordCount = sendRecords.filter((record) => getRecordStatus(record.result) === 'success').length;
  const partialRecordCount = sendRecords.filter((record) => getRecordStatus(record.result) === 'partial').length;
  const failedRecordCount = sendRecords.filter((record) => getRecordStatus(record.result) === 'failed').length;

  return (
    <div className="h-full overflow-hidden flex flex-col p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-8">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Phone size={36} className="text-cyan-400" />
                群组通话
              </h1>
              <p className="mt-1 text-base text-slate-400">
                在群组通话界面直接给终端设备下发文本播报。
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('tts')}
                className={`rounded-lg px-6 py-3 text-lg font-medium transition-all ${
                  activeTab === 'tts'
                    ? 'border border-cyan-400/50 bg-cyan-500/30 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Volume2 size={20} className="mr-2 inline" />
                讯息播报
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={`rounded-lg px-6 py-3 text-lg font-medium transition-all ${
                  activeTab === 'records'
                    ? 'border border-cyan-400/50 bg-cyan-500/30 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText size={20} className="mr-2 inline" />
                发送记录
              </button>
            </div>
          </div>

        <div className="flex gap-3 text-sm">
          <div className="rounded-xl border border-cyan-400/30 bg-slate-900/50 px-4 py-3 text-slate-200">
            <div className="text-slate-400">终端设备</div>
            <div className="mt-1 text-xl font-semibold text-white">{devices.length}</div>
          </div>
          <div className="rounded-xl border border-emerald-400/30 bg-slate-900/50 px-4 py-3 text-slate-200">
            <div className="text-slate-400">在线设备</div>
            <div className="mt-1 text-xl font-semibold text-emerald-300">{onlineDevices.length}</div>
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-slate-900/50 px-4 py-3 text-slate-200">
            <div className="text-slate-400">已选设备</div>
            <div className="mt-1 text-xl font-semibold text-amber-300">{selectedDevices.length}</div>
          </div>
        </div>
      </div>

      {activeTab === 'tts' ? (
        <div className="flex-1 flex gap-6 overflow-hidden">
          <section className="w-80 flex-shrink-0 flex flex-col rounded-2xl border border-cyan-400/25 bg-slate-900/50 p-5 backdrop-blur-sm shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">终端设备选择</h2>
                  <p className="text-sm text-slate-400">从设备列表里选择要播报的终端。</p>
                </div>
                <button
                  onClick={loadDevices}
                  disabled={loadingDevices}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 transition-all hover:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw size={14} className={loadingDevices ? 'animate-spin' : ''} />
                    刷新
                  </span>
                </button>
              </div>

              <div className="mb-4 relative">
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <button
                      onClick={() => setShowFilter(!showFilter)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                        activeFiltersCount > 0
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <Filter size={14} />
                      <span>筛选</span>
                      {activeFiltersCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-cyan-500 rounded-full">{activeFiltersCount}</span>
                      )}
                    </button>
                    
                    {showFilter && (
                      <div className="absolute top-full left-0 mt-2 z-[400] bg-slate-800 rounded-xl border border-cyan-400/30 shadow-2xl p-4 min-w-[300px]">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                            <span className="text-sm font-medium text-white">筛选条件</span>
                            <button onClick={resetFilters} className="text-xs text-cyan-400 hover:text-cyan-300">清除筛选</button>
                          </div>
                          
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                            <input
                              type="text"
                              value={searchKeyword}
                              onChange={(event) => setSearchKeyword(event.target.value)}
                              placeholder="模糊搜索设备名称、手机号、ID"
                              className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none transition-all focus:border-cyan-400/50"
                            />
                          </div>
                          
                          {companyTree.map((company: any) => (
                            <div key={company.id} className="space-y-2">
                              <button
                                onClick={() => {
                                  setSelectedCompany(selectedCompany === company.id ? 'all' : company.id);
                                  setSelectedProject('all');
                                  setSelectedTeam('all');
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-sm ${
                                  selectedCompany === company.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                📁 {company.name}
                              </button>
                              {selectedCompany === company.id && company.projects.map((project: any) => (
                                <div key={project.id} className="ml-4 space-y-1">
                                  <button
                                    onClick={() => {
                                      setSelectedProject(selectedProject === project.id ? 'all' : project.id);
                                      setSelectedTeam('all');
                                    }}
                                    className={`w-full text-left px-2 py-1 rounded-lg text-xs ${
                                      selectedProject === project.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-700'
                                    }`}
                                  >
                                    📄 {project.name}
                                  </button>
                                  {selectedProject === project.id && project.teams.map((team: string) => (
                                    <button
                                      key={team}
                                      onClick={() => setSelectedTeam(selectedTeam === team ? 'all' : team)}
                                      className={`ml-4 w-[calc(100%-1rem)] text-left px-2 py-1 rounded-lg text-xs ${
                                        selectedTeam === team ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:bg-slate-700'
                                      }`}
                                    >
                                      👥 {team}
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ))}
                          <button onClick={() => setShowFilter(false)} className="w-full py-1.5 bg-cyan-500 rounded-lg text-xs">确定</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={selectAllOnline}
                    className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300 transition-all hover:bg-emerald-500/25 whitespace-nowrap"
                  >
                    设备全选
                  </button>
                  <button
                    onClick={clearSelection}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-all hover:bg-slate-700 whitespace-nowrap"
                  >
                    清空已选
                  </button>
                </div>
              </div>

              {loadingError ? (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-base text-red-200">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{loadingError}</span>
                </div>
              ) : null}

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {loadingDevices && devices.length === 0 ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-8 text-base text-slate-400">
                  <LoaderCircle size={18} className="animate-spin" />
                  正在加载设备...
                </div>
              ) : null}

              {!loadingDevices && filteredDevices.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-8 text-center text-base text-slate-400">
                  当前没有匹配的终端设备
                </div>
              ) : null}

              {filteredDevices.map((device) => {
                const selected = selectedPhones.includes(device.phone);
                return (
                  <button
                    key={device.phone}
                    type="button"
                    onClick={() => togglePhoneSelection(device.phone)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      selected
                        ? 'border-cyan-400/60 bg-cyan-500/15'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-base font-semibold text-white">
                          <Users size={15} className="text-cyan-300" />
                          {device.device_name || device.phone}
                        </div>
                        <div className="mt-1 text-sm text-slate-400">终端号: {device.phone}</div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          device.is_online
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {device.is_online ? '在线' : '离线'}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-slate-400">
                      <div>ID: {device.id}</div>
                      <div>类型: {device.device_type || 'JT808'}</div>
                      {typeof device.last_longitude === 'number' && typeof device.last_latitude === 'number' ? (
                        <div className="flex items-center gap-1 text-slate-300">
                          <MapPin size={12} className="text-cyan-300" />
                          {device.last_longitude.toFixed(6)}, {device.last_latitude.toFixed(6)}
                        </div>
                      ) : null}
                    </div>

                    {selected ? (
                      <div className="mt-3 flex items-center gap-2 text-sm text-cyan-300">
                        <CheckCircle2 size={14} />
                        已加入本次播报
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

           <section className="flex-1 flex flex-col rounded-2xl border border-cyan-400/25 bg-slate-900/50 p-6 backdrop-blur-sm shadow-xl overflow-hidden">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-4 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-white">播报控制台</h2>
                <p className="mb-0 text-base text-slate-400">支持从控制台向选定终端设备进行播报，或对当前所有在线设备进行广播。</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSendMode('group')}
                  className={`rounded-xl border px-4 py-3 text-base transition-all ${
                    sendMode === 'group'
                      ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-300'
                      : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Users size={18} />
                    定向播报
                  </span>
                </button>
                <button
                  onClick={() => setSendMode('broadcast')}
                  className={`rounded-xl border px-4 py-3 text-base transition-all ${
                    sendMode === 'broadcast'
                      ? 'border-blue-400/60 bg-blue-500/20 text-blue-300'
                      : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Radio size={18} />
                    全体广播
                  </span>
                </button>
              </div>
            </div>

              <div className="relative mb-4 flex flex-1">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => setInputMode('text')}
                    className={`w-12 flex-1 rounded-l-xl flex items-center justify-center text-sm font-medium transition-all ${
                      inputMode === 'text'
                        ? 'bg-slate-950/70 border border-r-0 border-slate-700 text-cyan-300 -mr-px'
                        : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                    title="文本输入"
                  >
                    <Type size={20} />
                  </button>
                  <button
                    onClick={() => setInputMode('voice')}
                    className={`w-12 flex-1 rounded-l-xl flex items-center justify-center text-sm font-medium transition-all ${
                      inputMode === 'voice'
                        ? 'bg-slate-950/70 border border-r-0 border-slate-700 text-cyan-300 -mr-px'
                        : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                    title="语音输入"
                  >
                    <Mic size={20} />
                  </button>
                </div>

                <div className="relative flex-1">
                  {inputMode === 'text' ? (
                    <textarea
                      value={ttsText}
                      onChange={(event) => setTtsText(event.target.value)}
                          rows={8}
                      placeholder="请输入要下发到设备端播报的文本，例如：请前往 2 号通道进行集合点检。"
                      className="h-full min-h-[160px] max-h-[160px] w-full rounded-2xl rounded-l-none border border-slate-700 bg-slate-950/70 px-4 py-3 pr-44 pb-14 text-base text-slate-100 outline-none transition-all focus:border-cyan-400/50 resize-none overflow-y-auto"
                    />
                  ) : (
                    <div className="h-full min-h-[160px] max-h-[160px] rounded-2xl rounded-l-none border border-slate-700 bg-slate-950/70 p-4 pr-44 relative">
                      <div className="h-24 mb-3 text-base text-slate-100 overflow-y-auto">
                        {recordedText || '点击下方按钮开始录音...'}
                      </div>
                      
                      <div className="absolute bottom-12 left-4 right-44">
                        {voiceRecorded ? (
                          <div className="flex items-center gap-3">
                            <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="flex-shrink-0 rounded-full bg-cyan-500/20 p-2 text-cyan-400 hover:bg-cyan-500/30 transition-all"
                          >
                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 w-1/3 transition-all" />
                          </div>
                          <span className="text-xs text-slate-400">0:12</span>
                        </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  <div className="absolute right-3 bottom-3 flex gap-2">
                    {inputMode === 'voice' && (
                      <button
                        onMouseDown={() => {
                          setIsRecording(true);
                          setRecordedText('正在识别语音...');
                        }}
                        onMouseUp={() => {
                          setIsRecording(false);
                          setVoiceRecorded(true);
                          setRecordedText('请前往2号通道进行集合点检，注意安全佩戴好防护装备。');
                        }}
                        onMouseLeave={() => {
                          if (isRecording) {
                            setIsRecording(false);
                            setVoiceRecorded(true);
                            setRecordedText('请前往2号通道进行集合点检，注意安全佩戴好防护装备。');
                          }
                        }}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                          isRecording
                            ? 'bg-red-500 text-white animate-pulse scale-105'
                            : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                        }`}
                      >
                        <Mic size={16} className={isRecording ? 'animate-bounce' : ''} />
                        {isRecording ? '松开结束' : '按住说话'}
                      </button>
                    )}

                    <button
                      onClick={sendTts}
                      disabled={sending || (inputMode === 'voice' && !voiceRecorded)}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                      {sending ? '发送中...' : '发送'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-2 text-base font-medium text-slate-200">已选择播报目标</div>
                {targetDevices.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {targetDevices.map((device) => (
                      <span
                        key={`${sendMode}-${device.phone}`}
                        className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-200"
                      >
                        {device.device_name || device.phone}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-base text-slate-400">当前还没有可发送的目标设备。</div>
                )}
              </div>

              {sendError ? (
                <div className="mb-2 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-base text-red-200">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{sendError}</span>
                </div>
              ) : null}


            <hr className="my-2 border-slate-700/50" />

            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between gap-3 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-semibold text-white">接收回执</h2>
                </div>
                {latestResult ? (
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm text-cyan-300">
                    请求 {latestResult.requested_count} 台
                  </span>
                ) : null}
              </div>

              <div className="pr-1">
                {!latestResult ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-10 text-center text-base text-slate-400">
                    发送后，这里会显示设备接收结果。
                  </div>
                ) : (
                  <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="text-sm text-slate-400">请求设备</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{latestResult.requested_count}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                      <div className="text-sm text-emerald-200">成功</div>
                      <div className="mt-2 text-2xl font-semibold text-emerald-300">{latestResult.success_count}</div>
                    </div>
                    <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
                      <div className="text-sm text-red-200">失败</div>
                      <div className="mt-2 text-2xl font-semibold text-red-300">{latestResult.failed_count}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {latestResult.results.map((item) => (
                      <div
                        key={`${item.phone}-${item.sequence ?? 'none'}`}
                        className={`rounded-xl border px-4 py-3 ${
                          item.success
                            ? 'border-emerald-400/20 bg-emerald-500/10'
                            : 'border-red-400/20 bg-red-500/10'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-white">{item.device_name || item.phone}</div>
                            <div className="mt-1 text-sm text-slate-300">终端号: {item.phone}</div>
                          </div>
                          <div className="flex items-center gap-2 text-base">
                            {item.success ? (
                              <CheckCircle2 size={16} className="text-emerald-300" />
                            ) : (
                              <XCircle size={16} className="text-red-300" />
                            )}
                            <span className={item.success ? 'text-emerald-200' : 'text-red-200'}>{item.message}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                )}
              </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-cyan-400/25 bg-slate-900/50 p-4">
              <div className="text-sm text-slate-400">总发送次数</div>
              <div className="mt-2 text-3xl font-semibold text-white">{sendRecords.length}</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/25 bg-slate-900/50 p-4">
              <div className="text-sm text-slate-400">全部成功</div>
              <div className="mt-2 text-3xl font-semibold text-emerald-300">{successRecordCount}</div>
            </div>
            <div className="rounded-2xl border border-amber-400/25 bg-slate-900/50 p-4">
              <div className="text-sm text-slate-400">部分成功</div>
              <div className="mt-2 text-3xl font-semibold text-amber-300">{partialRecordCount}</div>
            </div>
            <div className="rounded-2xl border border-red-400/25 bg-slate-900/50 p-4">
              <div className="text-sm text-slate-400">全部失败</div>
              <div className="mt-2 text-3xl font-semibold text-red-300">{failedRecordCount}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {sendRecords.length === 0 ? (
              <div className="rounded-2xl border border-cyan-400/25 bg-slate-900/50 px-6 py-14 text-center text-slate-400">
                还没有发送记录，先去"文本播报"页发一次试试。
              </div>
            ) : (
              <div className="space-y-4">
              {sendRecords.map((record) => {
                const status = getRecordStatus(record.result);
                return (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-cyan-400/20 bg-slate-900/50 p-5 backdrop-blur-sm"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-white">
                            {record.mode === 'broadcast' ? '全体广播' : '定向播报'}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] ${
                              status === 'success'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : status === 'partial'
                                  ? 'bg-amber-500/15 text-amber-300'
                                  : 'bg-red-500/15 text-red-300'
                            }`}
                          >
                            {status === 'success' ? '成功' : status === 'partial' ? '部分成功' : '失败'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{formatDateTime(record.createdAt)}</div>
                      </div>

                      <div className="text-right text-sm text-slate-300">
                        <div>成功 {record.result.success_count}</div>
                        <div>失败 {record.result.failed_count}</div>
                      </div>
                    </div>

                    <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
                      {record.text}
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {record.targetNames.map((name) => (
                        <span
                          key={`${record.id}-${name}`}
                          className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300"
                        >
                          {name}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {record.result.results.map((item) => (
                        <div
                          key={`${record.id}-${item.phone}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm"
                        >
                          <div className="text-slate-200">
                            {item.device_name || item.phone}
                            <span className="ml-2 text-xs text-slate-500">{item.phone}</span>
                          </div>
                          <div className={item.success ? 'text-emerald-300' : 'text-red-300'}>{item.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
        </div>
      )}
    </div>
  );
}