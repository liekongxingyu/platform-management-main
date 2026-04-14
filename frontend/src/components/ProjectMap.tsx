import React, { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || "ab3044412b12b8deb9da741c6739be1d";
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE || "65a74edbb64d47769637df170a5da117";

interface ProjectMapProps {
    project: {
        id: number;
        name: string;
        center: [number, number];  // [lng, lat]
        zoom_level: number;
        area_boundary?: Array<[number, number]>;
        deviceCount?: number;
    };
    height?: string;
}

export const ProjectMap: React.FC<ProjectMapProps> = ({ project, height = "100%" }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const amapRef = useRef<any>(null);
    const [mapReady, setMapReady] = React.useState(false);

    // 生成模拟的在线设备位置（在项目区域内随机分布）
    const generateDevicePoints = (count: number, boundary: Array<[number, number]>) => {
        if (!boundary || boundary.length < 3) return [];
        
        // 获取边界范围
        const lngs = boundary.map(p => p[0]);
        const lats = boundary.map(p => p[1]);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        
        const points = [];
        for (let i = 0; i < Math.min(count, 50); i++) {
            points.push({
                id: i + 1,
                name: `设备${i + 1}`,
                lng: minLng + Math.random() * (maxLng - minLng),
                lat: minLat + Math.random() * (maxLat - minLat),
                isOnline: Math.random() > 0.2
            });
        }
        return points;
    };

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
                mapRef.current = new AMap.Map(mapContainerRef.current, {
                    zoom: project.zoom_level || 16,
                    center: project.center, 
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
    }, [project.center, project.zoom_level]);

    // 绘制区域和定位点
    useEffect(() => {
        if (!mapReady || !mapRef.current || !amapRef.current) return;

        const AMap = amapRef.current;
        const map = mapRef.current;

        // 清除旧覆盖物
        if ((map as any)._overlays) {
            (map as any)._overlays.forEach((overlay: any) => map.remove(overlay));
        }
        (map as any)._overlays = [];

        // 绘制项目区域边界（多边形）
        if (project.area_boundary && project.area_boundary.length >= 3) {
            const polygon = new AMap.Polygon({
                path: project.area_boundary,
                strokeColor: "#3b82f6",
                strokeOpacity: 0.8,
                strokeWeight: 3,
                fillColor: "#3b82f6",
                fillOpacity: 0.1,
            });
            map.add(polygon);
            (map as any)._overlays.push(polygon);
        }

        // ========== 1. 先添加项目名称文字（最底层）==========
        let textPosition = project.center;
        if (project.area_boundary && project.area_boundary.length >= 3) {
            const sum = project.area_boundary.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0]);
            textPosition = [sum[0] / project.area_boundary.length, sum[1] / project.area_boundary.length];
        }
        
        const verticalText = project.name.split('').map(char => `<span style="display: block; text-align: center;">${char}</span>`).join('');
        
        const nameMarker = new AMap.Marker({
            position: textPosition,
            content: `
                <div style="
                    background: transparent;
                    color: #3b82f6;
                    font-size: 40px;
                    font-weight: 700;
                    font-family: 'PingFang SC', 'Microsoft YaHei', 'STHeiti', system-ui, sans-serif;
                    text-align: center;
                    line-height: 1.3;
                    letter-spacing: 4px;
                    text-shadow: 0 0 25px rgba(59,130,246,0.9), 0 0 10px rgba(0,0,0,0.6);
                    -webkit-font-smoothing: antialiased;
                    white-space: nowrap;
                ">
                    ${verticalText}
                </div>
            `,
            offset: new AMap.Pixel(-20, -project.name.length * 22),
            anchor: 'top-center'
        });
        map.add(nameMarker);
        (map as any)._overlays.push(nameMarker);

        // // ========== 2. 添加中心标记（在文字上方）==========
        // const centerMarker = new AMap.Marker({
        //     position: project.center,
        //     content: `<div style="width: 28px; height: 28px; background: #3b82f6; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        //         <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        //             <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        //         </svg>
        //     </div>`,
        //     offset: new AMap.Pixel(-14, -14),
        // });
        // map.add(centerMarker);
        // (map as any)._overlays.push(centerMarker);

        // ========== 3. 最后添加设备点（最上层）==========
        // const devicePoints = generateDevicePoints(project.deviceCount || 50, project.area_boundary || []);
// 从 project.devices 获取设备列表，只显示在线设备
// 只显示在线且是定位类型的设备
const onlineDevices = (project.devices || []).filter(device => {
    const locationTypes = ['rtk', 'uwb', 'gps_tag', 'gps_band', 'smart_helmet'];
    return device.is_online === 1 && locationTypes.includes(device.type);
});

onlineDevices.forEach(device => {
    if (!device.lng || !device.lat) return;
    
    const marker = new AMap.Marker({
        position: [device.lng, device.lat],
        content: `<div style="width: 14px; height: 14px; background: #22c55e; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        offset: new AMap.Pixel(-7, -7),
        extData: device
    });
    
    marker.on('mouseover', () => {
        const holderName = device.holder_name || '未绑定';
        const holderPhone = device.holder_phone || '';
        const content = `
            <div style="padding: 8px 12px; min-width: 180px;">
                <div style="font-weight: bold; margin-bottom: 6px;">${device.name}</div>
                <div style="font-size: 12px; color: #666;">持有人: ${holderName}</div>
                ${holderPhone ? `<div style="font-size: 12px; color: #666;">电话: ${holderPhone}</div>` : ''}
                <div style="font-size: 12px; color: #22c55e; margin-top: 4px;">● 在线</div>
            </div>
        `;
        const infoWindow = new AMap.InfoWindow({
            content: content,
            offset: new AMap.Pixel(0, -10)
        });
        infoWindow.open(map, marker.getPosition());
        (map as any)._currentInfoWindow = infoWindow;
    });
    
    map.add(marker);
    (map as any)._overlays.push(marker);
});

        // 调整视野
        if (project.area_boundary && project.area_boundary.length >= 3) {
            map.setFitView();
        }

    }, [mapReady, project]);

    return <div ref={mapContainerRef} style={{ width: "100%", height, borderRadius: "8px", overflow: "hidden" }} />;
};