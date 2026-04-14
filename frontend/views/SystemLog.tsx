import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  User, 
  Shield, 
  MapPin, 
  Video, 
  AlertTriangle,
  Settings,
  LogIn,
  X,
  Filter
} from 'lucide-react';

interface SystemLog {
  id: string;
  operator: string;      // 操作人员
  action: string;        // 操作行为
  targetType: 'fence' | 'project' | 'device' | 'person' | 'alarm' | 'permission' | 'system' | 'login';
  targetName: string;    // 操作对象名称
  details: string;       // 详细信息
  time: string;          // 操作时间
  ip?: string;           // IP地址
}

// 模拟日志数据
const mockLogs: SystemLog[] = [
  {
    id: '1',
    operator: '管理员',
    action: '创建围栏',
    targetType: 'fence',
    targetName: '基坑禁入区',
    details: '圆形围栏，半径50米，禁止进入，严重等级',
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    ip: '192.168.1.1'
  },
  {
    id: '2',
    operator: '李四',
    action: '添加设备',
    targetType: 'device',
    targetName: '张工的安全帽',
    details: '设备ID: 1001，持有人: 张工，所属项目: 西安地铁8号线',
    time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    ip: '192.168.1.2'
  },
  {
    id: '3',
    operator: '王五',
    action: '处理告警',
    targetType: 'alarm',
    targetName: '非法闯入告警',
    details: '告警ID: f1，标记为已处理',
    time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    ip: '192.168.1.3'
  },
  {
    id: '4',
    operator: '管理员',
    action: '删除围栏',
    targetType: 'fence',
    targetName: '办公区禁出区',
    details: '围栏ID: 2',
    time: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    ip: '192.168.1.1'
  },
  {
    id: '5',
    operator: '赵六',
    action: '登录系统',
    targetType: 'login',
    targetName: '登录成功',
    details: '用户: 赵六',
    time: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    ip: '192.168.1.4'
  },
];

const actionIcons = {
  fence: <MapPin size={14} />,
  project: <FileText size={14} />,
  device: <Video size={14} />,
  person: <User size={14} />,
  alarm: <AlertTriangle size={14} />,
  permission: <Shield size={14} />,
  system: <Settings size={14} />,
  login: <LogIn size={14} />,
};

const actionColors = {
  fence: 'bg-blue-500/20 text-blue-400',
  project: 'bg-cyan-500/20 text-cyan-400',
  device: 'bg-green-500/20 text-green-400',
  person: 'bg-purple-500/20 text-purple-400',
  alarm: 'bg-orange-500/20 text-orange-400',
  permission: 'bg-red-500/20 text-red-400',
  system: 'bg-slate-500/20 text-slate-400',
  login: 'bg-emerald-500/20 text-emerald-400',
};

export default function SystemLog() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  useEffect(() => {
    setLogs([...mockLogs].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterType !== 'all' && log.targetType !== filterType) return false;
    if (searchKeyword && 
        !log.operator.includes(searchKeyword) && 
        !log.action.includes(searchKeyword) &&
        !log.targetName.includes(searchKeyword) &&
        !log.details.includes(searchKeyword)) return false;
    
    const logDate = new Date(log.time);
    if (startDate && logDate < new Date(startDate)) return false;
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      if (logDate > endDateTime) return false;
    }
    return true;
  });

  const stats = {
    total: logs.length,
    fence: logs.filter(l => l.targetType === 'fence').length,
    device: logs.filter(l => l.targetType === 'device').length,
    alarm: logs.filter(l => l.targetType === 'alarm').length,
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FileText size={28} className="text-cyan-400" />
          系统日志
        </h1>
        <p className="text-slate-400 text-sm mt-1">记录所有关键操作，支持追溯和审计</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-cyan-400/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">总操作数</span>
            <FileText size={20} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats.total}</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-blue-400/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">围栏操作</span>
            <MapPin size={20} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats.fence}</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-green-400/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">设备操作</span>
            <Video size={20} className="text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats.device}</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-orange-400/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">告警处理</span>
            <AlertTriangle size={20} className="text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats.alarm}</div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-cyan-400/30 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 类型筛选 */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">全部类型</option>
            <option value="fence">围栏操作</option>
            <option value="project">项目操作</option>
            <option value="device">设备操作</option>
            <option value="person">人员操作</option>
            <option value="alarm">告警处理</option>
            <option value="permission">权限操作</option>
            <option value="system">系统设置</option>
            <option value="login">登录记录</option>
          </select>

          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" />
            <input
              type="text"
              placeholder="搜索操作人员、行为、对象..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="space-y-2">
        {filteredLogs.map(log => (
          <div
            key={log.id}
            onClick={() => setSelectedLog(log)}
            className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 cursor-pointer transition-all hover:border-cyan-400/50"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${actionColors[log.targetType]}`}>
                  {actionIcons[log.targetType]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-white">{log.operator}</span>
                    <span className="text-cyan-400 text-sm">·</span>
                    <span className="text-slate-300">{log.action}</span>
                    <span className="text-slate-500 text-sm">·</span>
                    <span className="text-slate-400">{log.targetName}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{log.details}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{new Date(log.time).toLocaleString()}</span>
                    {log.ip && <span>IP: {log.ip}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p>暂无日志记录</p>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedLog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-cyan-400/30 shadow-2xl p-6 w-[500px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${actionColors[selectedLog.targetType]}`}>
                  {actionIcons[selectedLog.targetType]}
                </div>
                <h3 className="text-xl font-bold text-white">日志详情</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-slate-700 rounded">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400">操作人员：</span>
                  <span className="text-slate-200">{selectedLog.operator}</span>
                </div>
                <div>
                  <span className="text-slate-400">操作类型：</span>
                  <span className="text-slate-200">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400">操作对象：</span>
                  <span className="text-slate-200">{selectedLog.targetName}</span>
                </div>
                <div>
                  <span className="text-slate-400">操作时间：</span>
                  <span className="text-slate-200">{new Date(selectedLog.time).toLocaleString()}</span>
                </div>
                {selectedLog.ip && (
                  <div>
                    <span className="text-slate-400">IP地址：</span>
                    <span className="text-slate-200">{selectedLog.ip}</span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-slate-400">详细信息：</span>
                  <p className="text-slate-200 mt-1">{selectedLog.details}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelectedLog(null)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-all">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}