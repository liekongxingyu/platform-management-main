import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || "ab3044412b12b8deb9da741c6739be1d";
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE || "65a74edbb64d47769637df170a5da117";

interface TrackPoint {
  lat: number;
  lng: number;
  time: string;
  speed?: number;
}

interface TrackMapProps {
  points?: TrackPoint[];
  deviceName: string;
  holder: string;
  onClose: () => void;
}

// 生成连续移动的轨迹点（每5秒一个点，连续移动一整天）
const generateContinuousTrackPoints = (): TrackPoint[] => {
  const points: TrackPoint[] = [];
  
  // 起始点
  let currentLat = 34.2800;
  let currentLng = 109.1300;
  
  // 移动方向（模拟在工地范围内活动）
  // 使用正弦波模拟自然移动
  const startTime = new Date();
  startTime.setHours(7, 0, 0, 0); // 早上7点开始
  const endTime = new Date();
  endTime.setHours(19, 0, 0, 0);   // 晚上7点结束
  
  const totalSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
  const intervalSeconds = 5; // 每5秒一个点
  const totalPoints = Math.floor(totalSeconds / intervalSeconds);
  
  // 移动范围：经纬度各变化约0.01度（约1公里范围）
  const latRange = 0.012;
  const lngRange = 0.015;
  
  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints; // 0 到 1 的时间比例
    
    // 使用正弦波模拟来回走动
    const angle = t * Math.PI * 4; // 完成两个来回
    const latOffset = Math.sin(angle) * latRange * (1 - Math.abs(t - 0.5) * 0.5);
    const lngOffset = Math.cos(angle * 0.8) * lngRange * (1 - Math.abs(t - 0.5) * 0.5);
    
    // 中午12-13点休息，移动缓慢
    const hour = 7 + t * 12;
    let speedFactor = 1;
    if (hour >= 12 && hour <= 13) {
      speedFactor = 0.2; // 休息时间移动缓慢
    } else if (hour >= 17) {
      speedFactor = 0.6; // 下午移动稍慢
    }
    
    const lat = currentLat + latOffset * speedFactor;
    const lng = currentLng + lngOffset * speedFactor;
    
    const pointTime = new Date(startTime.getTime() + i * intervalSeconds * 1000);
    
    points.push({
      lat,
      lng,
      time: pointTime.toISOString(),
      speed: 2 + Math.random() * 3 // 随机速度 2-5 km/h
    });
  }
  
  console.log(`生成连续轨迹点: ${points.length} 个（每5秒一点，共${(totalPoints * intervalSeconds / 3600).toFixed(1)}小时）`);
  return points;
};

export const TrackMap: React.FC<TrackMapProps> = ({ 
  points: propPoints, 
  deviceName, 
  holder, 
  onClose 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const amapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用传入的点或生成连续移动轨迹
  const trackPoints = propPoints && propPoints.length > 0 
    ? propPoints 
    : generateContinuousTrackPoints();
  
  // 初始化地图
  useEffect(() => {
    let cancelled = false;
    const initMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;
      try {
        if (!(window as any)._AMapSecurityConfig) {
          (window as any)._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
        }
        const AMap = await AMapLoader.load({ key: AMAP_KEY, version: "2.0" });
        if (cancelled) return;
        
        amapRef.current = AMap;
        
        const centerLat = trackPoints.reduce((sum, p) => sum + p.lat, 0) / trackPoints.length;
        const centerLng = trackPoints.reduce((sum, p) => sum + p.lng, 0) / trackPoints.length;
        
        mapRef.current = new AMap.Map(mapContainerRef.current, {
          zoom: 16,
          zooms: [10, 18],
          center: [centerLng, centerLat],
          viewMode: "2D",
          layers: [
            new AMap.TileLayer.Satellite(),
            new AMap.TileLayer.RoadNet()
          ],
        });
        
        setMapReady(true);
      } catch (e) {
        console.error("AMap init failed", e);
      }
    };
    initMap();
    return () => {
      cancelled = true;
      if (mapRef.current && mapRef.current.destroy) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);
  
  // 绘制轨迹
  useEffect(() => {
    if (!mapReady || !mapRef.current || !amapRef.current) return;
    
    const AMap = amapRef.current;
    const map = mapRef.current;
    
    if ((map as any)._trackOverlays) {
      (map as any)._trackOverlays.forEach((overlay: any) => map.remove(overlay));
    }
    (map as any)._trackOverlays = [];
    
    const path = trackPoints.map(p => [p.lng, p.lat]);
    
    // 轨迹线
    const polyline = new AMap.Polyline({
      path: path,
      strokeColor: "#3b82f6",
      strokeWeight: 3,
      strokeOpacity: 0.8,
    });
    map.add(polyline);
    (map as any)._trackOverlays.push(polyline);
    
    // 起点
    const startPoint = trackPoints[0];
    const startMarker = new AMap.Marker({
      position: [startPoint.lng, startPoint.lat],
      content: `<div style="width: 22px; height: 22px; background: #22c55e; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: bold;">始</div>`,
      offset: new AMap.Pixel(-11, -11),
    });
    map.add(startMarker);
    (map as any)._trackOverlays.push(startMarker);
    
    // 终点
    const endPoint = trackPoints[trackPoints.length - 1];
    const endMarker = new AMap.Marker({
      position: [endPoint.lng, endPoint.lat],
      content: `<div style="width: 22px; height: 22px; background: #ef4444; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: bold;">终</div>`,
      offset: new AMap.Pixel(-11, -11),
    });
    map.add(endMarker);
    (map as any)._trackOverlays.push(endMarker);
    
    // 每隔50个点显示一个标记（避免太多）
    const step = Math.max(1, Math.floor(trackPoints.length / 50));
    for (let i = 0; i < trackPoints.length; i += step) {
      const point = trackPoints[i];
      const marker = new AMap.Marker({
        position: [point.lng, point.lat],
        content: `<div style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; border: 1px solid white;"></div>`,
        offset: new AMap.Pixel(-3, -3),
      });
      map.add(marker);
      (map as any)._trackOverlays.push(marker);
    }
    
    // map.setFitView();
    
  }, [mapReady, trackPoints]);
  
  // 播放动画
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentPointIndex(prev => {
          if (prev >= trackPoints.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, playSpeed, trackPoints.length]);
  
  // 更新移动标记
  useEffect(() => {
    if (!mapReady || !mapRef.current || !amapRef.current) return;
    
    const AMap = amapRef.current;
    const map = mapRef.current;
    
    if ((map as any)._movingMarker) {
      map.remove((map as any)._movingMarker);
    }
    
    const point = trackPoints[currentPointIndex];
    if (point) {
      const movingMarker = new AMap.Marker({
        position: [point.lng, point.lat],
        content: `<div style="width: 32px; height: 32px; background: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; animation: pulse 1s infinite;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
        </div>`,
        offset: new AMap.Pixel(-16, -32),
      });
      map.add(movingMarker);
      (map as any)._movingMarker = movingMarker;
    //   map.setCenter([point.lng, point.lat]);
    }
  }, [currentPointIndex, mapReady, trackPoints]);
  
  const formatTime = (timeStr: string) => {
    const d = new Date(timeStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };
  
  const totalDuration = trackPoints.length * 5 / 60; // 分钟
  
  return (
    <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-sm flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-cyan-400/30 bg-slate-900/50">
        <div>
          <h3 className="text-xl font-bold text-white">轨迹回放</h3>
          <p className="text-sm text-slate-400">{holder} - {deviceName}</p>
          <p className="text-xs text-slate-500">
            轨迹点: {trackPoints.length}个 | 时长: {totalDuration.toFixed(0)}分钟 | 间隔: 5秒/点
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
          <X size={20} className="text-slate-400" />
        </button>
      </div>
      
      <div ref={mapContainerRef} className="flex-1 w-full" />
      
      <div className="p-4 border-t border-cyan-400/30 bg-slate-900/50">
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>轨迹进度</span>
            <span>{currentPointIndex + 1} / {trackPoints.length}</span>
          </div>
          <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="absolute h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${(currentPointIndex + 1) / trackPoints.length * 100}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{trackPoints[0] ? formatTime(trackPoints[0].time) : ''}</span>
            <span>{trackPoints[currentPointIndex] ? formatTime(trackPoints[currentPointIndex].time) : ''}</span>
            <span>{trackPoints[trackPoints.length - 1] ? formatTime(trackPoints[trackPoints.length - 1].time) : ''}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setCurrentPointIndex(0)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">⏮</button>
          <button onClick={() => setCurrentPointIndex(p => Math.max(0, p - 10))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">◀◀ 10点</button>
          <button onClick={() => setCurrentPointIndex(p => Math.max(0, p - 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">◀ 1点</button>
          <button onClick={() => setIsPlaying(!isPlaying)} className={`px-5 py-2 rounded-full font-medium ${isPlaying ? 'bg-yellow-500' : 'bg-cyan-500'} text-white`}>
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>
          <button onClick={() => setCurrentPointIndex(p => Math.min(trackPoints.length - 1, p + 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">1点 ▶</button>
          <button onClick={() => setCurrentPointIndex(p => Math.min(trackPoints.length - 1, p + 10))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">10点 ▶▶</button>
          <button onClick={() => setCurrentPointIndex(trackPoints.length - 1)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">⏭</button>
          
          <select value={playSpeed} onChange={(e) => setPlaySpeed(Number(e.target.value))} className="px-2 py-1.5 bg-slate-700 rounded-lg text-sm">
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
            <option value={8}>8x</option>
            <option value={16}>16x</option>
            <option value={32}>32x</option>
          </select>
        </div>
        
        <div className="mt-3 text-center text-xs text-slate-400">
          {trackPoints[currentPointIndex] && (
            <>当前时间: {new Date(trackPoints[currentPointIndex].time).toLocaleString()} | 速度: {trackPoints[currentPointIndex].speed?.toFixed(1)} km/h</>
          )}
        </div>
      </div>
    </div>
  );
};