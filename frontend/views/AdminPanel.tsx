import React, { useState, useEffect } from 'react';
import {
  Users,
  Camera,
  MapPin,
  FolderTree,
  Fence,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Shield,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader,
  CheckCircle,
  AlertCircle,
  Settings,
} from 'lucide-react';

// ==================== 类型定义 ====================

interface Person {
  id: number;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  phone: string;
  photo?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Camera {
  id: number;
  name: string;
  ip: string;
  location: string;
  projectId: number;
  projectName?: string;
  status: 'online' | 'offline';
  type: 'fixed' | 'ptz' | 'thermal';
  remark?: string;
}

interface LocationDevice {
  id: number;
  name: string;
  deviceId: string;
  type: 'gps' | 'uwb' | 'ble';
  projectId: number;
  projectName?: string;
  status: 'online' | 'offline' | 'low_battery';
  battery?: number;
  lastLocation?: string;
  remark?: string;
}

interface Project {
  id: number;
  name: string;
  company: string;
  manager: string;
  phone: string;
  startDate: string;
  endDate?: string;
  status: 'ongoing' | 'completed' | 'suspended';
  address: string;
  description?: string;
}

interface ElectronicFence {
  id: number;
  name: string;
  projectId: number;
  projectName?: string;
  type: 'round' | 'polygon' | 'line';
  coordinates: string;
  alarmType: 'entry' | 'exit' | 'both';
  status: 'active' | 'inactive';
}

type TabType = 'person' | 'camera' | 'location' | 'project' | 'fence';

// ==================== 主组件 ====================

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('person');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 模拟数据
  const [persons, setPersons] = useState<Person[]>([
    { id: 1, name: '张三', employeeId: '10001', department: '安全管理部', position: '安全员', phone: '13800138001', status: 'active', createdAt: '2024-01-15' },
    { id: 2, name: '李四', employeeId: '10002', department: '施工管理部', position: '施工员', phone: '13800138002', status: 'active', createdAt: '2024-01-20' },
    { id: 3, name: '王五', employeeId: '10003', department: '技术质量部', position: '技术员', phone: '13800138003', status: 'inactive', createdAt: '2024-02-10' },
  ]);

  const [cameras, setCameras] = useState<Camera[]>([
    { id: 1, name: '北门出入口', ip: '192.168.1.101', location: '北门', projectId: 1, projectName: '西安地铁8号线', status: 'online', type: 'fixed' },
    { id: 2, name: '塔吊全景', ip: '192.168.1.102', location: '塔吊顶部', projectId: 1, projectName: '西安地铁8号线', status: 'online', type: 'ptz' },
    { id: 3, name: '材料堆放区', ip: '192.168.1.103', location: '东侧材料区', projectId: 2, projectName: '西安地铁10号线', status: 'offline', type: 'fixed' },
  ]);

  const [locationDevices, setLocationDevices] = useState<LocationDevice[]>([
    { id: 1, name: '安全帽定位器-001', deviceId: 'LOC001', type: 'uwb', projectId: 1, projectName: '西安地铁8号线', status: 'online', battery: 85, lastLocation: '北门附近' },
    { id: 2, name: '人员定位卡-002', deviceId: 'LOC002', type: 'ble', projectId: 1, projectName: '西安地铁8号线', status: 'online', battery: 62, lastLocation: '办公区' },
    { id: 3, name: '车辆定位器-003', deviceId: 'LOC003', type: 'gps', projectId: 2, projectName: '西安地铁10号线', status: 'low_battery', battery: 15, lastLocation: '材料堆放区' },
  ]);

  const [projects, setProjects] = useState<Project[]>([
    { id: 1, name: '西安地铁8号线', company: '中铁一局', manager: '张经理', phone: '13900139001', startDate: '2024-01-01', status: 'ongoing', address: '西安市雁塔区' },
    { id: 2, name: '西安地铁10号线', company: '中铁隧道局', manager: '李经理', phone: '13900139002', startDate: '2024-02-01', status: 'ongoing', address: '西安市未央区' },
    { id: 3, name: '西安北站扩建', company: '中铁建工', manager: '王经理', phone: '13900139003', startDate: '2023-06-01', status: 'ongoing', address: '西安市未央区' },
  ]);

  const [fences, setFences] = useState<ElectronicFence[]>([
    { id: 1, name: '北门电子围栏', projectId: 1, projectName: '西安地铁8号线', type: 'polygon', coordinates: '...', alarmType: 'both', status: 'active' },
    { id: 2, name: '危险区域围栏', projectId: 1, projectName: '西安地铁8号线', type: 'round', coordinates: '...', alarmType: 'entry', status: 'active' },
  ]);

  // 根据当前标签页获取数据
  const getCurrentData = () => {
    switch (activeTab) {
      case 'person': return persons;
      case 'camera': return cameras;
      case 'location': return locationDevices;
      case 'project': return projects;
      case 'fence': return fences;
      default: return [];
    }
  };

  const currentData = getCurrentData();
  
  // 筛选数据
  const filteredData = currentData.filter((item: any) => {
    const searchLower = searchTerm.toLowerCase();
    if (item.name?.toLowerCase().includes(searchLower)) return true;
    if (item.employeeId?.toLowerCase().includes(searchLower)) return true;
    if (item.deviceId?.toLowerCase().includes(searchLower)) return true;
    if (item.company?.toLowerCase().includes(searchLower)) return true;
    if (item.manager?.toLowerCase().includes(searchLower)) return true;
    return false;
  });

  // 分页
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ongoing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'offline': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'inactive': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'low_battery': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      online: '在线', active: '在职', ongoing: '进行中',
      offline: '离线', inactive: '离职', completed: '已完成',
      suspended: '暂停', low_battery: '低电量',
    };
    return map[status] || status;
  };

  // 渲染表头
  const renderTableHeader = () => {
    const headers: Record<TabType, { key: string; label: string }[]> = {
      person: [
        { key: 'name', label: '姓名' },
        { key: 'employeeId', label: '工号' },
        { key: 'department', label: '部门' },
        { key: 'position', label: '职位' },
        { key: 'phone', label: '电话' },
        { key: 'status', label: '状态' },
        { key: 'actions', label: '操作' },
      ],
      camera: [
        { key: 'name', label: '设备名称' },
        { key: 'ip', label: 'IP地址' },
        { key: 'location', label: '位置' },
        { key: 'projectName', label: '所属项目' },
        { key: 'type', label: '类型' },
        { key: 'status', label: '状态' },
        { key: 'actions', label: '操作' },
      ],
      location: [
        { key: 'name', label: '设备名称' },
        { key: 'deviceId', label: '设备ID' },
        { key: 'type', label: '类型' },
        { key: 'projectName', label: '所属项目' },
        { key: 'battery', label: '电量' },
        { key: 'status', label: '状态' },
        { key: 'actions', label: '操作' },
      ],
      project: [
        { key: 'name', label: '项目名称' },
        { key: 'company', label: '承建单位' },
        { key: 'manager', label: '项目经理' },
        { key: 'phone', label: '联系电话' },
        { key: 'startDate', label: '开工日期' },
        { key: 'status', label: '状态' },
        { key: 'actions', label: '操作' },
      ],
      fence: [
        { key: 'name', label: '围栏名称' },
        { key: 'projectName', label: '所属项目' },
        { key: 'type', label: '类型' },
        { key: 'alarmType', label: '告警类型' },
        { key: 'status', label: '状态' },
        { key: 'actions', label: '操作' },
      ],
    };
    return headers[activeTab];
  };

  // 渲染表格行
  const renderTableRow = (item: any, headers: any[]) => {
    return headers.map((header, idx) => {
      if (header.key === 'actions') {
        return (
          <td key={idx} className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="p-1 hover:bg-cyan-500/20 rounded text-cyan-400 transition-colors"
                title="编辑"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </td>
        );
      }
      
      if (header.key === 'status') {
        return (
          <td key={idx} className="px-4 py-3">
            <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusStyle(item.status)}`}>
              {getStatusText(item.status)}
            </span>
          </td>
        );
      }

      if (header.key === 'battery') {
        return (
          <td key={idx} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.battery > 50 ? 'bg-green-500' : item.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${item.battery}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{item.battery}%</span>
            </div>
          </td>
        );
      }

      return (
        <td key={idx} className="px-4 py-3 text-slate-300">
          {item[header.key] || '-'}
        </td>
      );
    });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('确定要删除吗？')) {
      // 根据当前标签页执行删除
      console.log('删除', activeTab, id);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const tabs = [
    { id: 'person' as TabType, label: '人员管理', icon: <Users size={18} /> },
    { id: 'camera' as TabType, label: '摄像头管理', icon: <Camera size={18} /> },
    { id: 'location' as TabType, label: '定位装置管理', icon: <MapPin size={18} /> },
    { id: 'project' as TabType, label: '项目管理', icon: <FolderTree size={18} /> },
    { id: 'fence' as TabType, label: '电子围栏', icon: <Fence size={18} /> },
  ];

  return (
    <div className="h-full flex flex-col gap-4 p-4 text-slate-100 bg-[radial-gradient(circle_at_12%_8%,rgba(56,189,248,0.20),transparent_32%),radial-gradient(circle_at_86%_2%,rgba(59,130,246,0.22),transparent_30%),linear-gradient(135deg,#020617,#0b1f3f_45%,#102a5e)]">
      
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Shield className="text-cyan-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">管理中心</h1>
            <p className="text-sm text-slate-400">人员、设备、项目统一管理</p>
          </div>
        </div>
      </div>

      {/* Tab 切换栏 */}
      <div className="rounded-lg border border-blue-400/30 bg-slate-900/65 backdrop-blur-md p-1 flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
              setSearchTerm('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm ${
              activeTab === tab.id
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 操作栏 */}
      <div className="rounded-lg border border-blue-400/30 bg-slate-900/65 backdrop-blur-md p-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" />
            <input
              type="text"
              placeholder={`搜索${tabs.find(t => t.id === activeTab)?.label}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            添加{tabs.find(t => t.id === activeTab)?.label.replace('管理', '')}
          </button>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="rounded-lg border border-blue-400/30 bg-slate-900/65 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-blue-400/20 bg-slate-800/50">
                <tr>
                  {renderTableHeader().map((header, idx) => (
                    <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={renderTableHeader().length} className="px-4 py-12 text-center">
                      <Loader className="animate-spin mx-auto text-cyan-400" size={32} />
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={renderTableHeader().length} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Settings size={32} className="opacity-50" />
                        <p>暂无数据</p>
                        <button onClick={handleAdd} className="text-cyan-400 text-sm hover:underline">
                          点击添加
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      {renderTableRow(item, renderTableHeader())}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-4 pt-3 border-t border-blue-400/20">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded bg-slate-800/50 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500/20 transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              上一页
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded text-sm transition-colors ${
                      currentPage === pageNum
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-cyan-500/30'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded bg-slate-800/50 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500/20 transition-colors flex items-center gap-1"
            >
              下一页
              <ChevronRight size={14} />
            </button>
            
            <span className="text-xs text-slate-400 ml-2">
              第 {currentPage} / {totalPages} 页
            </span>
          </div>
        )}
      </div>

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-300/30 rounded-lg w-[500px] p-6 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                <Settings size={18} className="text-cyan-300" />
                {editingItem ? '编辑' : '添加'} {tabs.find(t => t.id === activeTab)?.label.replace('管理', '')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-400 text-center py-8">
                表单功能待完善，当前为演示界面
              </p>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={handleSave} className="flex-1 bg-cyan-500 hover:bg-cyan-400 py-2 rounded text-sm font-bold text-slate-900 transition-colors shadow-md">
                保存
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm text-slate-100 transition-colors">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}