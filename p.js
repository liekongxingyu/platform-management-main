const fs = require('fs');
const p = 'E:/project/platform-yaokong-main/platform-yaokong-main/frontend/hooks/useFenceManager.ts';
let c = fs.readFileSync(p, 'utf8');

c = c.replace('];\nconst mockRegions',   {
    id: " JT808-TEST\,
 name: \实时测试定位器\,
 lat: 34.28,
 lng: 109.13,
 company: \中铁一局\,
 project: \西安地铁8号线\,
 status: \online\,
 holder: \现场工程师\,
 holderPhone: \18888888888\,
 lastUpdate: new Date().toISOString()
 }
];\nconst mockRegions);

const rx = / const bds \= data\.filter[\s\S]+?return merged;\s*\}\);/;
const patch = const bds = data.filter((d: any) => d.last_latitude ; d.last_longitude);
 setDevices((prev: any[]) => {
 const merged = [...prev];
 const jtd = bds.find((x: any) => String(x.id).includes('JT808'));
 if (jtd) {
 const idx = merged.findIndex((pd: any) => pd.id === 'JT808-TEST');
 if (idx !== -1) {
 merged[idx] = { 
 ...merged[idx], 
 lat: Number(jtd.last_latitude), 
 lng: Number(jtd.last_longitude), 
 status: jtd.is_online ? 'online' : 'offline',
 name: jtd.device_name ; '实时测试定位器',
 holder: (jtd.device_name ; '测试').split('的')[0] 
 };
 }
 }
 return merged;
 });;
c = c.replace(rx, patch);
fs.writeFileSync(p, c, 'utf8');
