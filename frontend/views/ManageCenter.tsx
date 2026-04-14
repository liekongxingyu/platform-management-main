import React, { useState, useEffect } from "react";
import {
  Search, Plus, Trash2, Edit2, Settings, X, MonitorPlay
} from "lucide-react";
import { Video, VideoCreate, VideoUpdate } from "../api/videoApi";
import CyberPanel from "./CyberPanel"; // 如果你也解耦了，否则从页面导入

interface DeviceManagerProps {
  devices: Video[];
  selectedDevice: Video | null;
  onSelectDevice: (device: Video) => void;
  onRefresh: () => void;
  onEditDevice: (device: Video) => void;
  onDeleteDevice: (id: number) => void;
}

export default function DeviceManager({
  devices,
  selectedDevice,
  onSelectDevice,
  onRefresh,
  onEditDevice,
  onDeleteDevice,
}: DeviceManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceForm, setNewDeviceForm] = useState<VideoCreate>({
    name: "",
    ip_address: "",
    port: 80,
    username: "",
    password: "",
    stream_url: "",
    status: "offline",
    remark: "",
  });

  // 搜索过滤
  const filteredDevices = devices.filter(
    (h) =>
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(h.id).includes(searchTerm)
  );

  return (
    <>
      <CyberPanel
        title="设备管理"
        icon={<MonitorPlay size={16} className="text-cyan-300" />}
        className="w-80 flex flex-col"
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 px-2 py-1 rounded text-xs flex items-center gap-1 font-semibold"
          >
            <Plus size={14} />
            新增
          </button>
        }
      >
        <div className="p-3 flex flex-col gap-3 h-full">
          <input
            type="text"
            placeholder="搜索设备..."
            className="bg-slate-950/65 border border-blue-300/35 rounded px-3 py-2 text-sm outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 text-slate-100 placeholder-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[calc(100vh-15rem)] vc-scrollbar pr-1">
            {filteredDevices.map((device) => (
              <div
                key={device.id}
                onClick={() => onSelectDevice(device)}
                className={`p-3 rounded border cursor-pointer transition-all flex justify-between items-center ${
                  selectedDevice?.id === device.id
                    ? "border-cyan-300/90 bg-cyan-400/15 shadow-[0_0_14px_rgba(56,189,248,.35)]"
                    : "border-blue-300/20 bg-slate-900/35 hover:border-cyan-300/45 hover:bg-sky-500/10"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate text-slate-100">
                    {device.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>
                      {device.ip_address}:{device.port}
                    </span>
                    {device.remark && (
                      <span className="bg-slate-800/90 px-1 rounded truncate max-w-[80px] border border-slate-700">
                        {device.remark}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditDevice(device);
                    }}
                    className="text-slate-500 hover:text-cyan-300 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDevice(device.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CyberPanel>

      {/* 添加设备弹窗（你也可以继续解耦成 Modal） */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-300/30 rounded-lg w-[500px] p-6 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                <Settings size={18} className="text-cyan-300" /> 添加监控设备
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  设备名称 <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full bg-slate-950/60 border border-blue-300/30 rounded p-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 outline-none text-slate-100"
                  value={newDeviceForm.name}
                  onChange={(e) =>
                    setNewDeviceForm({ ...newDeviceForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">IP</label>
                <input
                  className="w-full bg-slate-950/60 border border-blue-300/30 rounded p-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 outline-none text-slate-100"
                  value={newDeviceForm.ip_address}
                  onChange={(e) =>
                    setNewDeviceForm({ ...newDeviceForm, ip_address: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">端口</label>
                <input
                  type="number"
                  className="w-full bg-slate-950/60 border border-blue-300/30 rounded p-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 outline-none text-slate-100"
                  value={newDeviceForm.port}
                  onChange={(e) =>
                    setNewDeviceForm({ ...newDeviceForm, port: parseInt(e.target.value) || 80 })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">用户名</label>
                <input
                  className="w-full bg-slate-950/60 border border-blue-300/30 rounded p-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 outline-none text-slate-100"
                  value={newDeviceForm.username || ""}
                  onChange={(e) =>
                    setNewDeviceForm({ ...newDeviceForm, username: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">密码</label>
                <input
                  type="password"
                  className="w-full bg-slate-950/60 border border-blue-300/30 rounded p-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 outline-none text-slate-100"
                  value={newDeviceForm.password || ""}
                  onChange={(e) =>
                    setNewDeviceForm({ ...newDeviceForm, password: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">RTSP 流地址</label>
                <input
                  className="w-full bg-slate-950/60 border border-blue-300/30 rounded p-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 outline-none text-slate-100"
                  value={newDeviceForm.stream_url || ""}
                  onChange={(e) =>
                    setNewDeviceForm({ ...newDeviceForm, stream_url: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">备注</label>
                <input
                  className="w-full bg-slate-950/60 border border-blue-300/30 rounded p-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 outline-none text-slate-100"
                  value={newDeviceForm.remark || ""}
                  onChange={(e) =>
                    setNewDeviceForm({ ...newDeviceForm, remark: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  // 提交逻辑留在主页面，这里只抛事件
                  onAddDevice(newDeviceForm);
                  setShowAddModal(false);
                  setNewDeviceForm({
                    name: "",
                    ip_address: "",
                    port: 80,
                    username: "",
                    password: "",
                    stream_url: "",
                    status: "offline",
                    remark: "",
                  });
                }}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 py-2 rounded text-sm font-bold text-slate-900"
              >
                保存
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm text-slate-100"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
