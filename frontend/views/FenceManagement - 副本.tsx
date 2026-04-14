// views/FenceManagement.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Search, Filter, Plus, MapPin, Users, AlertTriangle, Info, ChevronDown, X, Circle, Hexagon } from "lucide-react";
import { useFenceManager } from "../hooks/useFenceManager";
import { useFenceMap } from "../hooks/useFenceMap";
import { FenceSidebar } from "../src/components/FenceSidebar";
import { FenceDrawTool } from "../src/components/FenceDrawTool";
import { FenceAddModal } from "../src/components/FenceAddModal";
import { FenceData, FenceDevice } from "./FenceType.tsx";
// 在 import 语句后面，组件之前添加这个接口定义
interface AlarmRecord {
  id: string;
  type: 'fence' | 'video';
  title: string;
  description: string;
  time: string;
  level: 'high' | 'medium' | 'low';
  status: 'pending' | 'resolved' | 'ignored';
  location: string;
  deviceName: string;
  deviceId: string;
  snapshot?: string;
  fenceId?: string;
  fenceName?: string;
}
export default function FenceManagement() {
  console.log("🔴 FenceManagement 组件渲染了");
  const [editingFenceId, setEditingFenceId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFence, setSelectedFence] = useState<FenceData | null>(null);
  const [violationTypes, setViolationTypes] = useState<Record<string, "No Entry" | "No Exit" | null>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [pendingFenceData, setPendingFenceData] = useState<any>(null); 
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; fenceId: string | null }>({ show: false, fenceId: null });
  const [alarmRecords, setAlarmRecords] = useState<AlarmRecord[]>([]);

// 添加一个函数来保存告警
const saveAlarm = useCallback((device: FenceDevice, violation: { fence: FenceData; type: string }) => {
  const newAlarm: AlarmRecord = {
    id: `fence_${Date.now()}_${Math.random()}`,
    type: 'fence',
    title: violation.type === '非法闯入' ? '非法闯入' : '非法越界',
    description: `${device.name}${violation.type}${violation.fence.name}`,
    time: new Date().toISOString(),
    level: violation.fence.severity === 'severe' ? 'high' : violation.fence.severity === 'risk' ? 'medium' : 'low',
    status: 'pending',
    location: violation.fence.name,
    deviceName: device.name,
    deviceId: device.id,
    fenceId: violation.fence.id,
    fenceName: violation.fence.name
  };
  
  // 保存到 localStorage 或调用 API
  const existingAlarms = JSON.parse(localStorage.getItem('alarm_records') || '[]');
  existingAlarms.unshift(newAlarm);
  // 只保留最近100条
  localStorage.setItem('alarm_records', JSON.stringify(existingAlarms.slice(0, 100)));
  
  // 同时触发自定义事件通知告警记录页面刷新
  window.dispatchEvent(new CustomEvent('alarmAdded', { detail: newAlarm }));
}, []);
  const {
    fences,
    devices,
    regions,
    filter,
    setFilter,
    drawingMode,
    setDrawingMode,
    tempPoints,
    setTempPoints,
    tempCenter,
    setTempCenter,
    addFence,
    updateFence,
    deleteFence,
    checkViolations,
    getFenceColor,
  } = useFenceManager();

  const {
    mapReady,
    mapRef, 
    setCenter,
    renderFences,
    renderDevices,
    renderDraft,
    bindClick,
  } = useFenceMap(mapContainerRef);

  console.log("🔵 mapReady 状态:", mapReady);
  // 获取所有公司和项目（用于筛选）
  const companies = ["all", ...new Set(fences.map(f => f.company).filter(Boolean))];
  const projects = filter.company && filter.company !== "all"
    ? ["all", ...new Set(fences.filter(f => f.company === filter.company).map(f => f.project))]
    : ["all", ...new Set(fences.map(f => f.project))];

  // 渲染地图内容
  // useEffect(() => {
  //   if (!mapReady) return;
    
  //   // 获取违规设备
  //   const violationMap: Record<string, "No Entry" | "No Exit" | null> = {};
  //   devices.forEach(device => {
  //     const violations = checkViolations(device);
  //     if (violations.length > 0) {
  //       violationMap[device.id] = violations[0].fence.behavior;
  //     }
  //   });
  //   setViolationTypes(violationMap);
    
  //   // 渲染围栏和区域
  //   renderFences(fences, regions, selectedFence?.id, undefined, (region) => {
  //     console.log("Region clicked:", region);
  //   });
    
  //   // 渲染设备
  //   renderDevices(devices, violationMap, new Set());
    
  //   // 渲染草稿
  //   renderDraft(drawingMode, 
  //     { type: drawingMode === "circle" ? "Circle" : "Polygon", center: tempCenter, points: tempPoints, radius: 50 },
  //     { points: tempPoints }
  //   );
  // }, [mapReady, fences, devices, regions, selectedFence, drawingMode, tempPoints, tempCenter]);
// 第1个 useEffect：只负责更新违规类型

// 函数2：重置所有绘制状态
const resetDrawing = () => {
  setDrawingMode("none");
  setTempPoints([]);
  setTempCenter(null);
  setPendingFenceData(null);
  setEditingFenceId(null);  // 新增
};

const handleDeleteClick = (id: string, e: React.MouseEvent) => {
  e.stopPropagation();
  setDeleteConfirm({ show: true, fenceId: id });
};

const confirmDelete = () => {
  if (deleteConfirm.fenceId) {
    deleteFence(deleteConfirm.fenceId);
  }
  setDeleteConfirm({ show: false, fenceId: null });
};

const cancelDelete = () => {
  setDeleteConfirm({ show: false, fenceId: null });
};
// 函数3：绘制完成后保存围栏
// 绘制完成后保存围栏
const handleSaveFenceAfterDraw = () => {
  if (!pendingFenceData) return;
  
  if (drawingMode === "circle" && tempCenter) {
    const newFence = {
      id: Date.now().toString(),
      name: pendingFenceData.name,
      company: pendingFenceData.company,
      project: pendingFenceData.project,
      description: pendingFenceData.description,
      behavior: pendingFenceData.behavior,
      severity: pendingFenceData.severity,
      shape: pendingFenceData.shape,
      center: tempCenter,
      points: pendingFenceData.points,
      radius: pendingFenceData.radius,
      schedule: {
 start: pendingFenceData.startTime + ":00",
end: pendingFenceData.endTime + ":00",
      },
      deviceIds: [],
      workerCount: 0,
    };
    
    addFence(newFence);
    // 保存后重置状态并关闭弹窗
    resetDrawing();
    setShowAddModal(false); // 关闭弹窗
    setPendingFenceData(null);
    alert("圆形围栏创建成功！");
  } else if (drawingMode === "polygon" && tempPoints.length >= 3) {
    const newFence = {
      id: Date.now().toString(),
      name: pendingFenceData.name,
      company: pendingFenceData.company,
      project: pendingFenceData.project,
      description: pendingFenceData.description,
      behavior: pendingFenceData.behavior,
      severity: pendingFenceData.severity,
      shape: pendingFenceData.shape,
      center: pendingFenceData.center,
      points: tempPoints,
      radius: pendingFenceData.radius,
      schedule: {
start: pendingFenceData.startTime + ":00",
end: pendingFenceData.endTime + ":00",
      },
      deviceIds: [],
      workerCount: 0,
    };
    
    addFence(newFence);
      setTimeout(() => {
    console.log("验证保存的数据:", fences);
  }, 500);
    resetDrawing();
    setShowAddModal(false);
    setPendingFenceData(null);
    alert("多边形围栏创建成功！");
  }
};

// 1. 独立的违规检测逻辑 - 只执行一次
// 定时检测违规（每3秒检测一次）
useEffect(() => {
  if (!mapReady) return;
  
  const interval = setInterval(() => {
    const newViolationMap: Record<string, "No Entry" | "No Exit" | null> = {};
    
    devices.forEach(device => {
      const violations = checkViolations(device);
      if (violations.length > 0) {
        const violation = violations[0];
        newViolationMap[device.id] = violation.fence.behavior;
        
        // 只在状态变化时报警并保存
        if (violationTypes[device.id] !== violation.fence.behavior) {
          // 保存告警记录
          saveAlarm(device, violation);
          
          // 原有的 toast 提示
          const toast = document.createElement('div');
          toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] bg-red-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-5 duration-200';
          toast.innerHTML = `
            <div class="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>⚠️ ${device.name} ${violation.type} ${violation.fence.name}</span>
            </div>
          `;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 1000);
        }
      }
    });
    
    setViolationTypes(newViolationMap);
  }, 1000);
  
  return () => clearInterval(interval);
}, [mapReady, devices, fences, checkViolations, violationTypes, saveAlarm]);



// 👇 在这里添加新的 useEffect
useEffect(() => {
  const handleFenceAdded = () => {
    console.log("🔍 围栏已添加，立即检测违规");
    const newViolationMap: Record<string, "No Entry" | "No Exit" | null> = {};
    
    devices.forEach(device => {
      const violations = checkViolations(device);
      if (violations.length > 0) {
        const violation = violations[0];
        newViolationMap[device.id] = violation.fence.behavior;
        
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] bg-red-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium';
        toast.innerHTML = `<div class="flex items-center gap-3"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>⚠️ ${device.name} ${violation.type} ${violation.fence.name}</span></div>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    });
    
    setViolationTypes(newViolationMap);
  };
  
  window.addEventListener('fenceAdded', handleFenceAdded);
  return () => window.removeEventListener('fenceAdded', handleFenceAdded);
}, [devices, checkViolations]);

// 第2个 useEffect：只负责渲染地图
useEffect(() => {
  if (!mapReady) return;
  // ...
}, [mapReady, fences, regions, selectedFence, drawingMode, tempPoints, tempCenter, devices]);
// 第2个 useEffect：只负责渲染地图
useEffect(() => {
  if (!mapReady) return;
  
  // 渲染围栏和区域
renderFences(
  fences, 
  regions, 
  selectedFence?.id, 
  undefined, 
  drawingMode !== "none", 
  (region) => {
    console.log("Region clicked:", region);
  },
  getFenceColor   // 第7个参数
);
  
  // 渲染设备 - 使用当前的 violationTypes
  renderDevices(devices, violationTypes, new Set());
  
  // 渲染草稿
renderDraft(drawingMode, 
  { 
    type: drawingMode === "circle" ? "Circle" : "Polygon", 
    center: tempCenter, 
    points: tempPoints, 
    radius: pendingFenceData?.radius || 50   // ← 改这里
  },
  { points: tempPoints }
);
}, [mapReady, fences, regions, selectedFence, drawingMode, tempPoints, tempCenter, devices]);


// 处理地图点击（绘制模式）- 修复版
useEffect(() => {
  if (!mapReady) return;
  if (drawingMode === "none") return;
  
  console.log("✅ 绘制模式激活，禁用地图拖拽");
  
  
  const handleMapClick = (lat: number, lng: number) => {
    console.log("📍 地图点击成功！", lat, lng);
    
    if (drawingMode === "circle") {
      setTempCenter([lat, lng]);
      // 圆形：点击后自动保存
      setTimeout(() => {
        if (tempCenter || true) {
          handleSaveFenceAfterDraw();
        }
      }, 100);
    } else if (drawingMode === "polygon") {
      setTempPoints(prev => {
        const newPoints = [...prev, [lat, lng]];
        console.log("当前顶点数:", newPoints.length);
        return newPoints;
      });
    }
  };
  
  // 直接绑定，不用变量存储
  const handler = (e: any) => {
    const lat = e.lnglat.getLat();
    const lng = e.lnglat.getLng();
    handleMapClick(lat, lng);
  };
  
  mapRef.current.on('click', handler);
  
  return () => {
    console.log("🔌 解绑地图点击事件");
    if (mapRef.current) {
      mapRef.current.off('click', handler);
      // 恢复地图拖拽
      mapRef.current.setStatus({
        dragEnable: true,
        zoomEnable: true,
        doubleClickZoom: true,
      });
    }
  };
}, [mapReady, drawingMode]); // 不要加其他依赖

  // 完成多边形绘制
const handlePolygonComplete = () => {
  if (tempPoints.length >= 3) {
    handleSaveFenceAfterDraw();
  } else {
    alert("多边形至少需要3个顶点");
  }
};

  // 取消绘制
const handleCancelDraw = () => {
  resetDrawing();
};

  // 保存新围栏
// 修改保存新围栏的函数
// const handleSaveFence = (data: any) => {
//   const newFence = {
//     id: Date.now().toString(),
//     name: data.name,
//     company: data.company,
//     project: data.project,
//     description: data.description,
//     behavior: data.behavior,
//     severity: data.severity,
//     shape: data.shape,
//     center: data.center,
//     points: data.points,
//     radius: data.radius,
//     schedule: {
//       start: data.startTime,
//       end: data.endTime,
//     },
//     deviceIds: [],
//     workerCount: 0,
//   };
  
//   addFence(newFence);
//   setShowAddModal(false);
//   setTempPoints([]);
//   setTempCenter(null);
//   setDrawingMode(null); // 退出绘制模式
// };
// 函数1：表单提交时调用（只保存表单数据，然后进入绘制模式）
const handleFenceFormSubmit = (data: any) => {
  console.log("📝 handleFenceFormSubmit 收到的 severity:", data.severity);
  console.log("📝 提交围栏数据", data);
  
  if (editingFenceId) {
    // 编辑模式：更新现有围栏
    updateFence(editingFenceId, {
      name: data.name,
      company: data.company,
      project: data.project,
      description: data.description,
      behavior: data.behavior,
      severity: data.severity,
      type: data.shape === "circle" ? "Circle" : "Polygon",
      center: data.center,
      points: data.points,
      radius: data.radius,
schedule: {
start: data.startTime + ":00",
end: data.endTime + ":00",
},
    });
    setEditingFenceId(null);
    alert("围栏更新成功！");
  } else {
    // 新增模式
    setPendingFenceData(data);
  }
  
  setShowAddModal(false);
  resetDrawing();
};





  // 编辑围栏
const handleEditFence = (fence: FenceData) => {
  console.log("编辑围栏:", fence);
  setEditingFenceId(fence.id);
  
  // 设置表单数据
  setPendingFenceData({
    name: fence.name,
    company: fence.company,
    project: fence.project,
    description: fence.description || "",
    behavior: fence.behavior,
    severity: fence.severity,
    shape: fence.type === "Circle" ? "circle" : "polygon",
    radius: fence.radius || 50,
    center: fence.center || null,
    points: fence.points || [],
  startTime: fence.schedule.start.slice(0, 16),  // 取前16位：2024-01-01T00:00
  endTime: fence.schedule.end.slice(0, 16),
  });
  
  // 设置绘制状态
  if (fence.type === "Circle") {
    setDrawingMode("circle");
    setTempCenter(fence.center || null);
  } else {
    setDrawingMode("polygon");
    setTempPoints(fence.points || []);
  }
  
  // 打开弹窗
  setShowAddModal(true);
};

  // 统计信息
  const stats = {
    totalFences: fences.length,
    activeFences: fences.filter(f => {
      const now = new Date();
      const start = new Date(f.schedule.start);
      const end = new Date(f.schedule.end);
      return now >= start && now <= end;
    }).length,
    totalDevices: devices.length,
    onlineDevices: devices.filter(d => d.status === "online").length,
    violations: Object.keys(violationTypes).length,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(56,189,248,0.20),transparent_32%),radial-gradient(circle_at_86%_2%,rgba(59,130,246,0.22),transparent_30%),linear-gradient(135deg,#020617,#0b1f3f_45%,#102a5e)] relative">
      {/* 顶部筛选栏 */}
      <div className="rounded-lg border border-blue-400/30 bg-slate-900/65 backdrop-blur-md m-4 mb-0 p-3 shadow-xl">


        <div className="flex items-center gap-2">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-cyan-400" />
              <input
                type="text"
                placeholder="搜索分公司、项目、围栏..."
                value={filter.keyword || ""}
                onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-md pl-7 pr-7 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              {filter.keyword && (
                <button onClick={() => setFilter({ ...filter, keyword: "" })} className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <X size={12} className="text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* 公司筛选 */}
          <div className="w-32">
              <select
                value={filter.company || "all"}
                onChange={(e) => setFilter({ ...filter, company: e.target.value === "all" ? undefined : e.target.value, project: undefined })}
                className="w-32 bg-slate-800/50 border border-cyan-400/40 rounded-md px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-cyan-400 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2380cbc4' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '14px'
                }}
              >
                {companies.map(company => (
                  <option key={company} value={company} className="bg-slate-800 text-slate-200">
                    {company === 'all' ? '所有分公司' : company}
                  </option>
                ))}
              </select>
          </div>

          {/* 项目筛选 */}
          <div className="w-32">
              <select
                value={filter.project || "all"}
                onChange={(e) => setFilter({ ...filter, project: e.target.value === "all" ? undefined : e.target.value })}
                className="w-32 bg-slate-800/50 border border-cyan-400/40 rounded-md px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-cyan-400 cursor-pointer"
              >
                {projects.map(project => (
                  <option key={project} value={project} className="bg-slate-800 text-slate-200">
                    {project === 'all' ? '所有项目' : project}
                  </option>
                ))}
              </select>
          </div>

          {/* 重置 */}
          {(filter.company || filter.project || filter.keyword) && (
            <button
              onClick={() => setFilter({})}
              className="px-2 py-1.5 text-sm text-cyan-400 hover:text-cyan-300"
            >
              重置
            </button>
          )}

          {/* 地点搜索 - 加在这里 */}
          {/* <div className="relative w-64 ml-2">
            <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-cyan-400" />
            <input
              type="text"
              id="place-search"
              placeholder="搜索地点..."
              className="w-full bg-slate-800/50 border border-cyan-400/40 rounded-md pl-7 pr-2 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div> */}
        </div>
      </div>

      {/* 地图容器 */}
<div className="flex-1 m-4 mt-2 rounded-lg overflow-hidden border border-blue-400/30 shadow-xl relative z-0">
  {/* 悬浮搜索栏 */}
  <div className="absolute top-4 left-4 z-10 w-96">
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 z-10" />
      <input
        type="text"
        id="place-search"
        placeholder="搜索地点..."
        className="w-full bg-slate-800/90 backdrop-blur-sm border border-cyan-400/40 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all shadow-xl"
        autoComplete="off"
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-cyan-400/50">
        
      </div>
    </div>
  </div>

    {/* {drawingMode !== "none" && (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-400/40 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-3">
        <div className="p-1.5 bg-cyan-500/20 rounded-lg">
          {drawingMode === "circle" ? (
            <Circle size={16} className="text-cyan-400" />
          ) : (
            <Hexagon size={16} className="text-cyan-400" />
          )}
        </div>
        <div className="text-sm">
          <span className="text-cyan-300 font-medium">
            {drawingMode === "circle" ? "圆形绘制模式" : "多边形绘制模式"}
          </span>
          <span className="text-slate-400 ml-2">
            {drawingMode === "circle" 
              ? "点击地图设置圆心" 
              : `已添加 ${tempPoints.length} 个顶点，${tempPoints.length >= 3 ? "可完成" : "至少需要3个"}`
            }
          </span>
        </div>
        {drawingMode === "circle" && (
          <div className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-md">
            半径: 50米
          </div>
        )}
        <div className="flex gap-1 ml-2">
          <button onClick={handleCancelDraw} className="p-1.5 hover:bg-red-500/20 rounded-lg">
            <X size={14} className="text-red-400" />
          </button>
          <button
            onClick={drawingMode === "circle" ? handleSaveFenceAfterDraw : handlePolygonComplete}
            disabled={drawingMode === "polygon" && tempPoints.length < 3}
            className={`p-1.5 rounded-lg ${
              (drawingMode === "circle" || tempPoints.length >= 3)
                ? "hover:bg-green-500/20 text-green-400"
                : "opacity-50 cursor-not-allowed text-slate-500"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )} */}

  <div ref={mapContainerRef} className="w-full h-full" />
</div>
    
{/* 图例说明 */}
<div className="absolute bottom-24 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-cyan-400/30 rounded-lg p-3 min-w-[180px] shadow-2xl">
  <div className="text-xs text-cyan-400 mb-2 font-bold">图例说明</div>
  <div className="space-y-2 text-xs">
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full" style={{ background: "#3b82f6" }} />
      <span className="text-slate-300">一般围栏（生效中）</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full" style={{ background: "#f97316" }} />
      <span className="text-slate-300">风险围栏（生效中）</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full" style={{ background: "#ef4444" }} />
      <span className="text-slate-300">严重围栏（生效中）</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full" style={{ background: "#64748b" }} />
      <span className="text-slate-300">未激活/已过期围栏</span>
    </div>
    <div className="border-t border-cyan-400/30 my-1"></div>
    <div className="flex items-center gap-2">
      <div className="w-5 h-5">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#22c55e" stroke="#fff" stroke-width="1"/>
        </svg>
      </div>
      <span className="text-slate-300">在线设备</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 relative">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444" stroke="#fff" stroke-width="1"/>
        </svg>
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white text-[8px] flex items-center justify-center text-white font-bold">!</div>
      </div>
      <span className="text-slate-300">违规设备</span>
    </div>
  </div>
</div>

      {/* 底部绘制按钮 */}
<button
  onClick={() => setShowAddModal(true)}  // 直接打开表单
  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold transition-all"
>
  <Plus size={20} />
  设置新围栏
</button>

{/* 🧪 测试按钮 - 直接进入绘制模式 */}
{/* <button
  onClick={() => {
    console.log("🧪 测试：直接设置绘制模式");
    setDrawingMode("circle");
    setPendingFenceData({
      name: "测试围栏",
      company: "测试公司", 
      project: "测试项目",
      description: "测试用围栏",
      behavior: "No Entry",
      severity: "general",
      shape: "circle",
      radius: 50,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 86400000).toISOString(),
    });
    setShowAddModal(false);
  }}
  className="absolute bottom-6 right-4 z-30 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold transition-all text-sm"
>
  🧪 测试绘制
</button> */}
      {/* 绘制工具条 */}
{/* {drawingMode !== "none" && (
  <FenceDrawTool
    mode={drawingMode}
    onModeChange={setDrawingMode}
    onComplete={drawingMode === "circle" ? handleSaveFenceAfterDraw : handlePolygonComplete}
    onCancel={handleCancelDraw}
    tempPoints={tempPoints}
  />
)} */}

{/* 围栏侧边栏 */}
{/* 围栏侧边栏 */}
<div className="absolute left-0 top-16 bottom-0 z-20">
  <FenceSidebar
    fences={fences}
    devices={devices}
    stats={stats}
    collapsed={sidebarCollapsed}
    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
    onSelectFence={(fence) => {
      setSelectedFence(fence);
      // 跳转到围栏位置
      if (fence.type === "Circle" && fence.center) {
        setCenter(fence.center);
        mapRef.current?.setZoom(18);
      } else if (fence.type === "Polygon" && fence.points && fence.points.length > 0) {
        // 计算多边形中心点
        const center = fence.points.reduce(
          (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
          [0, 0]
        );
        const centerLat = center[0] / fence.points.length;
        const centerLng = center[1] / fence.points.length;
        setCenter([centerLat, centerLng]);
        mapRef.current?.setZoom(16);
      }
    }}
    onEditFence={handleEditFence}
  onDeleteFence={handleDeleteClick}
  violationTypes={violationTypes} 
  />
</div>

// 修改 FenceAddModal 的调用
{/* 修改 FenceAddModal 的调用 */}
<FenceAddModal
  isOpen={showAddModal}
  onClose={() => {
    console.log("🔴 弹窗关闭");
    setShowAddModal(false);
    setPendingFenceData(null);
  }}
  onNext={(data) => {
    console.log("🔴 下一步", data);
    setPendingFenceData(data);
    if (data.shape === "circle") {
      setDrawingMode("circle");
    } else if (data.shape === "polygon") {
      setDrawingMode("polygon");
      setTempPoints([]);
    }
  }}
onSaveFence={(data) => {
  console.log("🔴 onSaveFence 中的 severity:", data.severity);
  console.log("🔴 完成创建", data);
  console.log("接收到的 startTime:", data.startTime);
console.log("接收到的 endTime:", data.endTime);
  const newFence = {
    id: Date.now().toString(),
    name: data.name,
    company: data.company,
    project: data.project,
    description: data.description,
    behavior: data.behavior,
    severity: data.severity,
    shape: data.shape,
    center: data.center,
    points: data.points,
    radius: data.radius,
    schedule: {
start: data.startTime + ":00",
end: data.endTime + ":00",
    },
    deviceIds: [],
    workerCount: 0,
  };
  addFence(newFence);
  resetDrawing();
  setShowAddModal(false);
  
  // 自定义美观提示（悬浮通知）
// 屏幕正中心大弹窗
const modal = document.createElement('div');
modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm';
modal.innerHTML = `
  <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-green-500/40 shadow-2xl p-8 min-w-[360px] text-center animate-in zoom-in duration-200">
    <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-green-500/20 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-green-400">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    </div>
    <h3 class="text-2xl font-bold text-white mb-3">创建成功</h3>
    <p class="text-slate-300 text-base">围栏已成功添加到系统</p>
  </div>
`;
document.body.appendChild(modal);
setTimeout(() => {
  modal.classList.add('opacity-0', 'transition-opacity', 'duration-300');
  setTimeout(() => modal.remove(), 300);
}, 1500);
}}
  tempCenter={tempCenter}
  tempPoints={tempPoints}
  drawingMode={drawingMode}
    companies={companies.filter(c => c !== "all")}
  projects={projects.filter(p => p !== "all")}
/>
{/* 自定义确认弹窗 */}
{deleteConfirm.show && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-cyan-400/30 shadow-2xl p-6 min-w-[320px] text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
        <AlertTriangle size={32} className="text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">确认废弃</h3>
      <p className="text-slate-300 text-sm mb-6">确定要废弃这个围栏吗？此操作不可恢复。</p>
      <div className="flex gap-3">
        <button
          onClick={cancelDelete}
          className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-all"
        >
          取消
        </button>
        <button
          onClick={confirmDelete}
          className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition-all"
        >
          确认废弃
        </button>
      </div>
    </div>
  </div>
)} 
  </div>
  );
}