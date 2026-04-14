import React, { useState, useEffect } from 'react';
import { Shield, Save, RotateCcw, ChevronRight, ChevronDown, Search, X } from 'lucide-react';

// ============================================
// 类型定义
// ============================================
interface Role {
  id: string;
  name: string;
  code: string;
  level: 'headquarters_admin' | 'branch_admin' | 'project_safety_admin';
  description: string;
}

interface PermissionNode {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  children?: PermissionNode[];
}

// ============================================
// 静态数据
// ============================================
const roles: Role[] = [
  { id: '1', name: '系统管理员', code: 'headquarters_admin', level: 'headquarters_admin', description: '拥有所有权限' },
  { id: '2', name: '分公司管理员', code: 'branch_admin', level: 'branch_admin', description: '拥有所属分公司所有权限' },
  { id: '3', name: '项目管理员', code: 'project_safety_admin', level: 'project_safety_admin', description: '拥有所属项目权限' },
];

const permissionTree: PermissionNode[] = [
  {
    id: 'dashboard',
    name: '仪表板',
    code: 'dashboard',
    children: [
      { id: 'dashboard.view', name: '查看仪表板', code: 'dashboard.view', parentId: 'dashboard' },
    ]
  },
  {
    id: 'monitor',
    name: '视频监控',
    code: 'monitor',
    children: [
      { id: 'monitor.playback', name: '监控回放', code: 'monitor.playback', parentId: 'monitor' },
      { id: 'monitor.track', name: '轨迹回放', code: 'monitor.track', parentId: 'monitor' },
      { id: 'monitor.voice', name: '语音回放', code: 'monitor.voice', parentId: 'monitor' },
      { id: 'monitor.camera', name: '摄像头管理', code: 'monitor.camera', parentId: 'monitor' },
    ]
  },
  {
    id: 'fence',
    name: '电子围栏',
    code: 'fence',
    children: [
      { id: 'fence.view', name: '查看围栏', code: 'fence.view', parentId: 'fence' },
      { id: 'fence.create', name: '创建围栏', code: 'fence.create', parentId: 'fence' },
      { id: 'fence.edit', name: '编辑围栏', code: 'fence.edit', parentId: 'fence' },
      { id: 'fence.delete', name: '删除围栏', code: 'fence.delete', parentId: 'fence' },
    ]
  },
  {
    id: 'device',
    name: '设备管理',
    code: 'device',
    children: [
      { id: 'device.view', name: '查看设备', code: 'device.view', parentId: 'device' },
      { id: 'device.create', name: '添加设备', code: 'device.create', parentId: 'device' },
      { id: 'device.edit', name: '编辑设备', code: 'device.edit', parentId: 'device' },
      { id: 'device.delete', name: '删除设备', code: 'device.delete', parentId: 'device' },
    ]
  },
  {
    id: 'personnel',
    name: '人员管理',
    code: 'personnel',
    children: [
      { id: 'personnel.view', name: '查看人员', code: 'personnel.view', parentId: 'personnel' },
      { id: 'personnel.create', name: '添加人员', code: 'personnel.create', parentId: 'personnel' },
      { id: 'personnel.edit', name: '编辑人员', code: 'personnel.edit', parentId: 'personnel' },
      { id: 'personnel.delete', name: '删除人员', code: 'personnel.delete', parentId: 'personnel' },
    ]
  },
  {
    id: 'alarm',
    name: '告警管理',
    code: 'alarm',
    children: [
      { id: 'alarm.view', name: '查看告警', code: 'alarm.view', parentId: 'alarm' },
      { id: 'alarm.handle', name: '处理告警', code: 'alarm.handle', parentId: 'alarm' },
    ]
  },
  {
    id: 'system',
    name: '系统管理',
    code: 'system',
    children: [
      { id: 'system.role', name: '权限管理', code: 'system.role', parentId: 'system' },
      { id: 'system.log', name: '操作日志', code: 'system.log', parentId: 'system' },
    ]
  },
];

// 各角色默认权限
const defaultPermissions: Record<string, string[]> = {
  headquarters_admin: [
    'dashboard.view',
    'monitor.playback', 'monitor.track', 'monitor.voice', 'monitor.camera',
    'fence.view', 'fence.create', 'fence.edit', 'fence.delete',
    'device.view', 'device.create', 'device.edit', 'device.delete',
    'personnel.view', 'personnel.create', 'personnel.edit', 'personnel.delete',
    'alarm.view', 'alarm.handle',
    'system.role', 'system.log',
  ],
  branch_admin: [
    'dashboard.view',
    'monitor.playback', 'monitor.track', 'monitor.voice', 'monitor.camera',
    'fence.view', 'fence.create', 'fence.edit', 'fence.delete',
    'device.view', 'device.create', 'device.edit',
    'personnel.view', 'personnel.create', 'personnel.edit',
    'alarm.view', 'alarm.handle',
  ],
  project_safety_admin: [
    'dashboard.view',
    'monitor.playback', 'monitor.track', 'monitor.voice',
    'fence.view', 'fence.create',
    'device.view',
    'personnel.view',
    'alarm.view', 'alarm.handle',
  ],
};

// ============================================
// 权限树组件（带复选框）
// ============================================
interface PermissionTreeProps {
  data: PermissionNode[];
  checkedKeys: string[];
  onCheck: (code: string, checked: boolean) => void;
  searchKeyword?: string;
}

const PermissionTreeItem: React.FC<{
  node: PermissionNode;
  checkedKeys: string[];
  onCheck: (code: string, checked: boolean) => void;
  level: number;
  searchKeyword?: string;
}> = ({ node, checkedKeys, onCheck, level, searchKeyword }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isChecked = checkedKeys.includes(node.code);
  
  // 高亮搜索关键字
  const highlightName = () => {
    if (!searchKeyword) return node.name;
    const regex = new RegExp(`(${searchKeyword})`, 'gi');
    const parts = node.name.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-yellow-500/30 text-yellow-200">{part}</span> : part
    );
  };

  return (
    <div>
      <div 
        className="flex items-center py-1.5 px-2 hover:bg-slate-700/50 rounded cursor-pointer"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {hasChildren && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="p-0.5 mr-1 text-slate-400 hover:text-cyan-300"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        
        <label className="flex items-center gap-2 cursor-pointer flex-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onCheck(node.code, e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
          />
          <span className="text-sm text-slate-200">{highlightName()}</span>
        </label>
      </div>
      
      {hasChildren && expanded && (
        <div className="ml-2">
          {node.children!.map(child => (
            <PermissionTreeItem
              key={child.id}
              node={child}
              checkedKeys={checkedKeys}
              onCheck={onCheck}
              level={level + 1}
              searchKeyword={searchKeyword}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// 主组件
// ============================================
export default function PermissionManagement() {
  const [selectedRole, setSelectedRole] = useState<Role>(roles[0]);
  const [checkedPermissions, setCheckedPermissions] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [saving, setSaving] = useState(false);

  // 切换角色时加载权限
  useEffect(() => {
    const perms = defaultPermissions[selectedRole.level] || [];
    setCheckedPermissions(perms);
    setHasChanges(false);
  }, [selectedRole]);

  // 处理勾选
  const handleCheck = (code: string, checked: boolean) => {
    setCheckedPermissions(prev => 
      checked ? [...prev, code] : prev.filter(c => c !== code)
    );
    setHasChanges(true);
  };

  // 保存权限
  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: 调用后端API保存权限配置
      console.log('保存权限:', {
        roleId: selectedRole.id,
        roleCode: selectedRole.code,
        permissions: checkedPermissions
      });
      
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHasChanges(false);
      alert(`权限配置已保存（${selectedRole.name}）`);
    } catch (error) {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置权限
  const handleReset = () => {
    const perms = defaultPermissions[selectedRole.level] || [];
    setCheckedPermissions(perms);
    setHasChanges(false);
  };

  // 过滤权限树
  const filteredTree = searchKeyword
    ? permissionTree.filter(node => 
        node.name.includes(searchKeyword) || 
        node.children?.some(c => c.name.includes(searchKeyword))
      ).map(node => ({
        ...node,
        children: node.children?.filter(c => c.name.includes(searchKeyword))
      }))
    : permissionTree;

  return (
    <div className="rounded-lg border border-blue-400/30 bg-slate-900/65 backdrop-blur-md p-4 h-full overflow-auto">
      
      {/* 标题栏 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-cyan-400" />
          <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
            权限管理
          </h2>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <RotateCcw size={14} />
              重置
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>

      {/* 双栏布局 */}
      <div className="flex gap-4 min-h-[500px]">
        
        {/* 左侧：角色列表 */}
        <div className="w-56 bg-slate-800/30 rounded-xl border border-cyan-400/20 overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-cyan-400/20 bg-slate-800/50">
            <h3 className="font-semibold text-cyan-300 text-sm">角色列表</h3>
          </div>
          <div className="py-2">
            {roles.map(role => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-2.5 cursor-pointer transition-all border-l-2 ${
                  selectedRole.id === role.id
                    ? 'bg-cyan-500/20 border-cyan-400'
                    : 'border-transparent hover:bg-slate-700/50'
                }`}
              >
                <div className="font-medium text-sm text-slate-200">{role.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{role.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：权限配置 */}
        <div className="flex-1 bg-slate-800/30 rounded-xl border border-cyan-400/20 overflow-hidden flex flex-col">
          
          {/* 头部 */}
          <div className="p-3 border-b border-cyan-400/20 bg-slate-800/50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-cyan-300 text-sm">
                  {selectedRole.name} - 权限配置
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  勾选下方权限点，为该角色分配访问权限
                </p>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" />
                <input
                  type="text"
                  placeholder="搜索权限..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-48 bg-slate-700/50 border border-slate-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                {searchKeyword && (
                  <button 
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X size={12} className="text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* 权限树 */}
          <div className="flex-1 overflow-y-auto p-3 max-h-[500px]">
            {filteredTree.length > 0 ? (
              filteredTree.map(node => (
                <PermissionTreeItem
                  key={node.id}
                  node={node}
                  checkedKeys={checkedPermissions}
                  onCheck={handleCheck}
                  level={0}
                  searchKeyword={searchKeyword}
                />
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">
                未找到匹配的权限
              </div>
            )}
          </div>
          
          {/* 底部统计 */}
          <div className="p-3 border-t border-cyan-400/20 bg-slate-800/30 text-xs text-slate-400">
            已选择 <span className="text-cyan-400 font-bold">{checkedPermissions.length}</span> 项权限
          </div>
        </div>
      </div>
    </div>
  );
}