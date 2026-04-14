import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  Video, 
  MapPin, 
  FileText, 
  Shield, 
  Mail, 
  Database,
  HardDrive,
  Moon,
  Sun,
  Globe,
  Clock,
  Volume2,
  VolumeX,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  X,
  Bot,
  Database as DatabaseIcon,
} from 'lucide-react';

// 设置分类
type SettingsTab = 'general' | 'alarm' | 'video' | 'fence' | 'log' | 'account' | 'notification' | 'backup' | 'advanced' | 'ai';

// 设置数据结构
interface SystemSettings {
  // 通用设置
  systemName: string;
  theme: 'light' | 'dark';
  language: 'zh' | 'en';
  timezone: string;
  
  // 告警设置
  alarmPopup: boolean;
  alarmSound: boolean;
  alarmSoundType: 'none' | 'standard' | 'emergency';
  alarmRepeatInterval: number;
  alarmAutoResolve: boolean;
  alarmRetentionDays: number;
  
  // 视频设置
  videoRetentionDays: number;
  videoQuality: 'high' | 'medium' | 'low';
  videoSegmentMinutes: number;
  videoStorageType: 'local' | 'cloud' | 'hybrid';
    videoStoragePath: string;           // 视频存储根目录
  alarmVideoRetentionDays: number;    // 告警视频保存天数
  alarmScreenshotRetentionDays: number; // 告警截图保存天数
  
  // 围栏设置
  fenceDetectionInterval: number;
  fenceDefaultRadius: number;
  fenceRetentionDays: number;
  
  // 日志设置
  logRetentionDays: number;
  logAutoClean: boolean;
  logLevel: 'all' | 'error' | 'warning';
  
  // 通知设置
  emailNotification: boolean;
  smsNotification: boolean;
  emailServer: string;
  emailPort: number;
  
  // 备份设置
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupTime: string;
  backupRetention: number;
  
  // AI 助手设置
  aiServiceUrl: string;
  aiEnableRAG: boolean;
  aiKbName: string;
  aiModelName: string;
  aiVectorDbPath: string;
}

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SystemSettings>({
    systemName: '中铁一局智能安全管理系统',
    theme: 'dark',
    language: 'zh',
    timezone: 'Asia/Shanghai',
    alarmPopup: true,
    alarmSound: true,
    alarmSoundType: 'standard',
    alarmRepeatInterval: 5,
    alarmAutoResolve: false,
    alarmRetentionDays: 30,
    videoRetentionDays: 15,
    videoQuality: 'high',
    videoSegmentMinutes: 30,
    videoStorageType: 'local',
    fenceDetectionInterval: 3,
    fenceDefaultRadius: 50,
    fenceRetentionDays: 365,
    logRetentionDays: 90,
    logAutoClean: true,
    logLevel: 'all',
    emailNotification: false,
    smsNotification: false,
    emailServer: 'smtp.example.com',
    emailPort: 587,
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    backupRetention: 7,
      videoStoragePath: 'D:/media',           // 默认存储路径
  alarmVideoRetentionDays: 90,            // 告警视频保存90天
  alarmScreenshotRetentionDays: 90,       // 告警截图保存90天
  
      // AI 助手设置
  aiServiceUrl: 'http://localhost:8888',
  aiEnableRAG: true,
  aiKbName: 'default',
  aiModelName: 'DeepSeek-R1-Distill-Qwen-7B-F16',
  aiVectorDbPath: './vector_db',
  });
  
  const [saved, setSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSave = () => {
    // 保存设置到 localStorage 或 API
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    console.log('保存设置:', settings);
  };

  const handleReset = () => {
    if (confirm('确定要恢复默认设置吗？所有修改将丢失。')) {
      // 恢复默认设置
      const defaultSettings: SystemSettings = {
        systemName: '中铁一局智能安全管理系统',
        theme: 'dark',
        language: 'zh',
        timezone: 'Asia/Shanghai',
        alarmPopup: true,
        alarmSound: true,
        alarmSoundType: 'standard',
        alarmRepeatInterval: 5,
        alarmAutoResolve: false,
        alarmRetentionDays: 30,
        videoRetentionDays: 15,
        videoQuality: 'high',
        videoSegmentMinutes: 30,
        videoStorageType: 'local',
        fenceDetectionInterval: 3,
        fenceDefaultRadius: 50,
        fenceRetentionDays: 365,
        logRetentionDays: 90,
        logAutoClean: true,
        logLevel: 'all',
        emailNotification: false,
        smsNotification: false,
        emailServer: 'smtp.example.com',
        emailPort: 587,
        autoBackup: true,
        backupFrequency: 'daily',
        backupTime: '02:00',
        backupRetention: 7,
      };
      setSettings(defaultSettings);
    }
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('密码长度至少6位');
      return;
    }
    console.log('修改密码:', passwordData);
    setShowPasswordModal(false);
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    alert('密码修改成功！');
  };

  const tabs = [
    { key: 'general', label: '通用设置', icon: Settings },
    { key: 'ai', label: 'AI 助手设置', icon: Bot },
    { key: 'alarm', label: '告警设置', icon: Bell },
    { key: 'video', label: '视频设置', icon: Video },
    { key: 'fence', label: '围栏设置', icon: MapPin },
    { key: 'log', label: '日志设置', icon: FileText },
    { key: 'account', label: '账号安全', icon: Shield },
    { key: 'notification', label: '通知设置', icon: Mail },
    { key: 'backup', label: '数据备份', icon: Database },
    { key: 'advanced', label: '高级设置', icon: HardDrive },
  ];

  return (
    <div className="h-full overflow-auto p-6">
      {/* 标题 */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings size={28} className="text-cyan-400" />
            系统设置
          </h1>
          <p className="text-slate-400 text-sm mt-1">配置系统各项参数</p>
        </div>
        <div className="flex gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/20 px-3 py-2 rounded-lg">
              <CheckCircle size={16} />
              <span className="text-sm">保存成功</span>
            </div>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <RotateCcw size={16} />
            恢复默认
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Save size={16} />
            保存设置
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* 左侧导航 */}
        <div className="w-56 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as SettingsTab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-cyan-400/30 p-6">
          {/* 通用设置 */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">通用设置</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">系统名称</label>
                    <input
                      type="text"
                      value={settings.systemName}
                      onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">主题</label>
                    <select
                      value={settings.theme}
                      onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    >
                      <option value="dark">深色</option>
                      <option value="light">浅色</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">语言</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value as 'zh' | 'en' })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    >
                      <option value="zh">中文</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">时区</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    >
                      <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
                      <option value="Asia/Chongqing">重庆时间 (UTC+8)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI 助手设置 */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">AI 智能助手设置</h2>
              
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">大语言模型服务配置</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">API 服务地址</label>
                    <input
                      type="text"
                      value={settings.aiServiceUrl}
                      onChange={(e) => setSettings({ ...settings, aiServiceUrl: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400/50"
                      placeholder="http://localhost:8888"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">模型名称</label>
                    <input
                      type="text"
                      value={settings.aiModelName}
                      onChange={(e) => setSettings({ ...settings, aiModelName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400/50"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <DatabaseIcon size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">知识库 (RAG) 配置</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm text-white">启用知识库检索</div>
                      <div className="text-xs text-slate-400">开启后将使用知识库内容增强回答</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.aiEnableRAG}
                        onChange={(e) => setSettings({ ...settings, aiEnableRAG: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">知识库名称</label>
                    <input
                      type="text"
                      value={settings.aiKbName}
                      onChange={(e) => setSettings({ ...settings, aiKbName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">向量数据库路径</label>
                    <input
                      type="text"
                      value={settings.aiVectorDbPath}
                      onChange={(e) => setSettings({ ...settings, aiVectorDbPath: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400/50"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-400/30">
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">使用说明</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• 启动后端 LLM 服务：进入 backend/LargeLanguageModel 目录运行 python main.py</li>
                  <li>• 确保 Ollama 服务已启动并已下载对应的模型</li>
                  <li>• 知识库向量库会自动生成在 vector_db 目录下</li>
                  <li>• 修改配置后点击"保存设置"按钮生效</li>
                </ul>
              </div>
            </div>
          )}

          {/* 告警设置 */}
          {activeTab === 'alarm' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">告警设置</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-white">告警弹窗</div>
                    <div className="text-xs text-slate-400">有新告警时弹出窗口提示</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.alarmPopup}
                      onChange={(e) => setSettings({ ...settings, alarmPopup: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-white">告警声音</div>
                    <div className="text-xs text-slate-400">有新告警时播放声音</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.alarmSound}
                      onChange={(e) => setSettings({ ...settings, alarmSound: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                {settings.alarmSound && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">声音类型</label>
                    <select
                      value={settings.alarmSoundType}
                      onChange={(e) => setSettings({ ...settings, alarmSoundType: e.target.value as 'none' | 'standard' | 'emergency' })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    >
                      <option value="standard">标准</option>
                      <option value="emergency">紧急</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">告警重复间隔(分钟)</label>
                    <input
                      type="number"
                      value={settings.alarmRepeatInterval}
                      onChange={(e) => setSettings({ ...settings, alarmRepeatInterval: Number(e.target.value) })}
                      min={1}
                      max={30}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">告警保留天数</label>
                    <input
                      type="number"
                      value={settings.alarmRetentionDays}
                      onChange={(e) => setSettings({ ...settings, alarmRetentionDays: Number(e.target.value) })}
                      min={7}
                      max={180}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-white">告警自动处理</div>
                    <div className="text-xs text-slate-400">30秒后自动标记为已处理</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.alarmAutoResolve}
                      onChange={(e) => setSettings({ ...settings, alarmAutoResolve: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

{/* 视频设置 */}
{activeTab === 'video' && (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-white mb-4">视频设置</h2>
    
    {/* 录像保存路径 */}
    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <HardDrive size={16} className="text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">视频保存路径</h3>
      </div>
      
      <div className="mb-3">
        <label className="block text-sm text-slate-400 mb-1">存储根目录</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={settings.videoStoragePath || 'D:/media'}
            onChange={(e) => setSettings({ ...settings, videoStoragePath: e.target.value })}
            placeholder="例如: D:/media 或 /opt/video-storage"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          />
<button 
  onClick={() => {
    // 创建隐藏的 file input 元素
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;  // 选择文件夹
    input.directory = true;
    
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        // 获取第一个文件的路径作为文件夹路径
        const fullPath = files[0].webkitRelativePath;
        const folderPath = fullPath.split('/')[0];
        const selectedPath = files[0].path?.replace(folderPath, '').replace(/\\/g, '/');
        
        // 获取实际路径（不同浏览器处理不同）
        let realPath = '';
        if (files[0].path) {
          // Chrome 浏览器
          realPath = files[0].path.split(folderPath)[0] + folderPath;
        } else {
          // 其他浏览器，提示用户手动输入
          alert('请手动输入路径，或使用 Chrome 浏览器');
          return;
        }
        
        setSettings({ ...settings, videoStoragePath: realPath });
      }
    };
    
    input.click();
  }}
  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-200 transition-all"
>
  浏览
</button>
        </div>
        <p className="text-xs text-slate-500 mt-1">建议使用独立磁盘分区，避免系统盘空间不足</p>
      </div>
      
      {/* 子文件夹说明 */}
      <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
        <div className="text-xs text-slate-300 font-medium mb-1">文件存储结构：</div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 shrink-0">├──</span>
            <div>
              <span className="text-cyan-300">{settings.videoStoragePath || 'D:/media'}</span>
              <span className="text-slate-500 ml-1">(根目录)</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 shrink-0">│   ├──</span>
            <div>
              <span className="text-yellow-300">recordings/</span>
              <span className="text-slate-400 ml-1">- 常规录像分段</span>
              <div className="text-slate-500 ml-4">每30秒一段，按设备ID分文件夹存储</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 shrink-0">│   ├──</span>
            <div>
              <span className="text-red-300">alarm_videos/</span>
              <span className="text-slate-400 ml-1">- 告警视频</span>
              <div className="text-slate-500 ml-4">AI检测到异常时自动保存的片段</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 shrink-0">│   ├──</span>
            <div>
              <span className="text-purple-300">playback_videos/</span>
              <span className="text-slate-400 ml-1">- 常态化回放</span>
              <div className="text-slate-500 ml-4">按3小时窗口合并的归档视频</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 shrink-0">│   ├──</span>
            <div>
              <span className="text-blue-300">temp_cache/</span>
              <span className="text-slate-400 ml-1">- 临时缓存</span>
              <div className="text-slate-500 ml-4">手动触发的临时录像，自动清理旧文件</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 shrink-0">│   └──</span>
            <div>
              <span className="text-green-300">alarm_screenshots/</span>
              <span className="text-slate-400 ml-1">- 告警截图</span>
              <div className="text-slate-500 ml-4">告警发生时自动截取的图片</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 磁盘空间提示 */}
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>当前磁盘可用空间</span>
          <span className="text-green-400">125.6 GB / 500 GB</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <div className="bg-cyan-500 h-full rounded-full" style={{ width: '25%' }}></div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          ⚠️ 当剩余空间低于 10GB 时，系统将自动清理最早的录像文件
        </p>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm text-slate-400 mb-1">录像保存天数</label>
        <input
          type="number"
          value={settings.videoRetentionDays}
          onChange={(e) => setSettings({ ...settings, videoRetentionDays: Number(e.target.value) })}
          min={1}
          max={90}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        />
        <p className="text-xs text-slate-500 mt-1">超过此天数的常规录像将被自动清理</p>
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">录像质量</label>
        <select
          value={settings.videoQuality}
          onChange={(e) => setSettings({ ...settings, videoQuality: e.target.value as 'high' | 'medium' | 'low' })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        >
          <option value="high">高清 (H.264, 4Mbps)</option>
          <option value="medium">标清 (H.264, 2Mbps)</option>
          <option value="low">流畅 (H.265, 1Mbps)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">录像分段时长(分钟)</label>
        <input
          type="number"
          value={settings.videoSegmentMinutes}
          onChange={(e) => setSettings({ ...settings, videoSegmentMinutes: Number(e.target.value) })}
          min={5}
          max={60}
          step={5}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        />
        <p className="text-xs text-slate-500 mt-1">当前后端配置: 0.5分钟(30秒)/段</p>
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">存储方式</label>
        <select
          value={settings.videoStorageType}
          onChange={(e) => setSettings({ ...settings, videoStorageType: e.target.value as 'local' | 'cloud' | 'hybrid' })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        >
          <option value="local">本地存储</option>
          <option value="cloud">云存储</option>
          <option value="hybrid">混合存储</option>
        </select>
      </div>
    </div>
    
    {/* 告警视频独立设置 */}
    <div className="border-t border-slate-700/50 pt-4 mt-2">
      <h3 className="text-sm font-semibold text-white mb-3">告警录像设置</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">告警录像保存天数</label>
          <input
            type="number"
            value={settings.alarmVideoRetentionDays || 90}
            onChange={(e) => setSettings({ ...settings, alarmVideoRetentionDays: Number(e.target.value) })}
            min={7}
            max={365}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">告警截图保存天数</label>
          <input
            type="number"
            value={settings.alarmScreenshotRetentionDays || 90}
            onChange={(e) => setSettings({ ...settings, alarmScreenshotRetentionDays: Number(e.target.value) })}
            min={7}
            max={365}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          />
        </div>
      </div>
    </div>
  </div>
)}
          {/* 围栏设置 */}
          {activeTab === 'fence' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">电子围栏设置</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">检测间隔(秒)</label>
                  <input
                    type="number"
                    value={settings.fenceDetectionInterval}
                    onChange={(e) => setSettings({ ...settings, fenceDetectionInterval: Number(e.target.value) })}
                    min={1}
                    max={10}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">默认半径(米)</label>
                  <input
                    type="number"
                    value={settings.fenceDefaultRadius}
                    onChange={(e) => setSettings({ ...settings, fenceDefaultRadius: Number(e.target.value) })}
                    min={10}
                    max={500}
                    step={10}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">围栏数据保留天数</label>
                  <input
                    type="number"
                    value={settings.fenceRetentionDays}
                    onChange={(e) => setSettings({ ...settings, fenceRetentionDays: Number(e.target.value) })}
                    min={30}
                    max={730}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>
              <div>
  <label className="block text-sm text-slate-400 mb-1">轨迹数据保存天数</label>
  <select
    value={settings.trackRetentionDays}
    onChange={(e) => setSettings({ ...settings, trackRetentionDays: Number(e.target.value) })}
    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
  >
    <option value={7}>7天</option>
    <option value={15}>15天</option>
    <option value={30}>30天</option>
    <option value={60}>60天</option>
    <option value={90}>90天</option>
  </select>
</div>
            </div>
            
          )}

          {/* 日志设置 */}
          {activeTab === 'log' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">日志设置</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">日志保留天数</label>
                  <input
                    type="number"
                    value={settings.logRetentionDays}
                    onChange={(e) => setSettings({ ...settings, logRetentionDays: Number(e.target.value) })}
                    min={7}
                    max={365}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">日志级别</label>
                  <select
                    value={settings.logLevel}
                    onChange={(e) => setSettings({ ...settings, logLevel: e.target.value as 'all' | 'error' | 'warning' })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="all">全部</option>
                    <option value="error">仅错误</option>
                    <option value="warning">仅警告</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-white">日志自动清理</div>
                  <div className="text-xs text-slate-400">超过保留天数的日志自动删除</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.logAutoClean}
                    onChange={(e) => setSettings({ ...settings, logAutoClean: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          )}

          {/* 账号安全 */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">账号安全</h2>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white">修改密码</div>
                    <div className="text-xs text-slate-400">定期更换密码提高安全性</div>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-sm transition-all"
                  >
                    修改密码
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">密码有效期(天)</label>
                  <input
                    type="number"
                    defaultValue={90}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    placeholder="90"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">登录失败锁定次数</label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">会话超时(分钟)</label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    placeholder="30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 通知设置 */}
          {activeTab === 'notification' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">通知设置</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-white">邮件通知</div>
                    <div className="text-xs text-slate-400">告警通过邮件发送</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotification}
                      onChange={(e) => setSettings({ ...settings, emailNotification: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-white">短信通知</div>
                    <div className="text-xs text-slate-400">告警通过短信发送</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.smsNotification}
                      onChange={(e) => setSettings({ ...settings, smsNotification: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                {settings.emailNotification && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">SMTP服务器</label>
                      <input
                        type="text"
                        value={settings.emailServer}
                        onChange={(e) => setSettings({ ...settings, emailServer: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">端口</label>
                      <input
                        type="number"
                        value={settings.emailPort}
                        onChange={(e) => setSettings({ ...settings, emailPort: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 数据备份 */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">数据备份</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-white">自动备份</div>
                    <div className="text-xs text-slate-400">定期自动备份系统数据</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                {settings.autoBackup && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">备份频率</label>
                      <select
                        value={settings.backupFrequency}
                        onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                      >
                        <option value="daily">每天</option>
                        <option value="weekly">每周</option>
                        <option value="monthly">每月</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">备份时间</label>
                      <input
                        type="time"
                        value={settings.backupTime}
                        onChange={(e) => setSettings({ ...settings, backupTime: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">保留备份数量</label>
                      <input
                        type="number"
                        value={settings.backupRetention}
                        onChange={(e) => setSettings({ ...settings, backupRetention: Number(e.target.value) })}
                        min={1}
                        max={30}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 高级设置 */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">高级设置</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertTriangle size={16} />
                  <span>修改高级设置可能影响系统稳定性，请谨慎操作</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">调试模式</label>
                  <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200">
                    <option value="false">关闭</option>
                    <option value="true">开启</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">API密钥</label>
                  <input
                    type="text"
                    placeholder="请输入API密钥"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <button
                  onClick={() => {
                    if (confirm('确定恢复所有设置为默认值吗？此操作不可撤销。')) {
                      handleReset();
                    }
                  }}
                  className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-all"
                >
                  恢复全部默认设置
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-cyan-400/30 shadow-2xl p-6 w-[450px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">修改密码</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 hover:bg-slate-700 rounded">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">原密码</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">新密码</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">确认新密码</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleChangePassword}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-sm font-medium transition-all"
              >
                确认修改
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-all"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}