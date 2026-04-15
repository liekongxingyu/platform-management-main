"""
围栏模块控制器 —— MongoDB版
提供围栏、定位设备、项目区域的完整 CRUD 接口。
真实 JT808 定位器的坐标会在 GET /fence/devices 中自动合并。
"""
import copy
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.jt808_service import jt808_manager
from app.services.Fence.fence_service import FenceService

# 初始化服务
fence_service = FenceService()

router = APIRouter(prefix="/fence", tags=["Electronic Fence"])

# ============================================================
#  Pydantic 模型（前后端数据交换格式）
# ============================================================

class Schedule(BaseModel):
    start: str
    end: str

class FenceItem(BaseModel):
    id: str
    name: str
    company: str
    project: str
    type: str  # "Circle" | "Polygon"
    behavior: str  # "No Entry" | "No Exit"
    severity: str  # "normal" | "risk" | "severe"
    schedule: Schedule
    center: Optional[List[float]] = None
    radius: Optional[float] = None
    points: Optional[List[List[float]]] = None
    createdAt: str
    updatedAt: str

class FenceCreate(BaseModel):
    name: str
    company: Optional[str] = ""
    project: Optional[str] = ""
    shape: str  # "circle" | "polygon"  (前端传来的字段名)
    behavior: str
    severity: str
    schedule: Optional[Schedule] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    center: Optional[List[float]] = None
    radius: Optional[float] = None
    points: Optional[List[List[float]]] = None

class DeviceItem(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    company: str
    project: str
    status: str  # "online" | "offline"
    holder: str
    holderPhone: Optional[str] = None
    lastUpdate: str

class RegionItem(BaseModel):
    id: str
    name: str
    company: str
    project: str
    points: List[List[float]]

class WorkTeamItem(BaseModel):
    id: str
    name: str
    color: str
    fences: List[FenceItem]

# ============================================================
#  内存数据（从原前端 mock 数据搬过来）
# ============================================================

_now_iso = datetime.now().isoformat()

FENCES: List[dict] = [
    {
        "id": "1",
        "name": "基坑禁入区",
        "company": "中铁一局",
        "project": "西安地铁8号线",
        "type": "Circle",
        "behavior": "No Entry",
        "severity": "severe",
        "center": [34.28, 109.13],
        "radius": 50,
        "schedule": {"start": "2024-01-01T00:00:00", "end": "2024-12-31T23:59:59"},
        "createdAt": "2024-01-01",
        "updatedAt": "2024-01-01",
    },
    {
        "id": "2",
        "name": "办公区禁出区",
        "company": "中铁一局",
        "project": "西安地铁8号线",
        "type": "Polygon",
        "behavior": "No Exit",
        "severity": "normal",
        "points": [[34.282, 109.132], [34.283, 109.135], [34.281, 109.136], [34.28, 109.133]],
        "schedule": {"start": "2024-01-01T00:00:00", "end": "2024-12-31T23:59:59"},
        "createdAt": "2024-01-01",
        "updatedAt": "2024-01-01",
    },
    {
        "id": "3",
        "name": "隧道施工区",
        "company": "中铁隧道局",
        "project": "西安地铁10号线",
        "type": "Polygon",
        "behavior": "No Entry",
        "severity": "risk",
        "points": [[34.29, 109.14], [34.295, 109.145], [34.292, 109.148], [34.287, 109.143]],
        "schedule": {"start": "2024-01-01T00:00:00", "end": "2024-12-31T23:59:59"},
        "createdAt": "2024-01-01",
        "updatedAt": "2024-01-01",
    },
]

DEVICES: List[dict] = [
    # ---- 中铁一局 - 西安地铁8号线（15个设备）----
    {"id": "1001", "name": "张工的安全帽", "lat": 34.281, "lng": 109.131, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "张三",   "holderPhone": "138****1234", "lastUpdate": _now_iso},
    {"id": "1002", "name": "李工的安全帽", "lat": 34.284, "lng": 109.134, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "李四",   "holderPhone": "139****5678", "lastUpdate": _now_iso},
    {"id": "1003", "name": "王工的定位器", "lat": 34.279, "lng": 109.129, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "王五",   "holderPhone": "136****9012", "lastUpdate": _now_iso},
    {"id": "1004", "name": "赵工的安全帽", "lat": 34.283, "lng": 109.136, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "赵六",   "holderPhone": "137****3456", "lastUpdate": _now_iso},
    {"id": "1005", "name": "孙工的定位器", "lat": 34.286, "lng": 109.132, "company": "中铁一局", "project": "西安地铁8号线", "status": "offline", "holder": "孙七",   "holderPhone": "135****7890", "lastUpdate": _now_iso},
    {"id": "1006", "name": "周工的安全帽", "lat": 34.278, "lng": 109.128, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "周八",   "holderPhone": "138****2345", "lastUpdate": _now_iso},
    {"id": "1007", "name": "吴工的定位器", "lat": 34.285, "lng": 109.138, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "吴九",   "holderPhone": "139****6789", "lastUpdate": _now_iso},
    {"id": "1008", "name": "郑工的安全帽", "lat": 34.282, "lng": 109.130, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "郑十",   "holderPhone": "136****0123", "lastUpdate": _now_iso},
    {"id": "1009", "name": "陈工的定位器", "lat": 34.287, "lng": 109.135, "company": "中铁一局", "project": "西安地铁8号线", "status": "offline", "holder": "陈十一", "holderPhone": "137****4567", "lastUpdate": _now_iso},
    {"id": "1010", "name": "林工的安全帽", "lat": 34.280, "lng": 109.133, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "林十二", "holderPhone": "135****8901", "lastUpdate": _now_iso},
    {"id": "1011", "name": "黄工的定位器", "lat": 34.284, "lng": 109.129, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "黄十三", "holderPhone": "138****3456", "lastUpdate": _now_iso},
    {"id": "1012", "name": "刘工的安全帽", "lat": 34.281, "lng": 109.137, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "刘十四", "holderPhone": "139****7890", "lastUpdate": _now_iso},
    {"id": "1013", "name": "罗工的定位器", "lat": 34.279, "lng": 109.131, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "罗十五", "holderPhone": "136****1234", "lastUpdate": _now_iso},
    {"id": "1014", "name": "梁工的安全帽", "lat": 34.286, "lng": 109.134, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "梁十六", "holderPhone": "137****5678", "lastUpdate": _now_iso},
    {"id": "1015", "name": "谢工的定位器", "lat": 34.283, "lng": 109.128, "company": "中铁一局", "project": "西安地铁8号线", "status": "online",  "holder": "谢十七", "holderPhone": "135****9012", "lastUpdate": _now_iso},
    # ---- 中铁隧道局 - 西安地铁10号线（5个设备）----
    {"id": "2001", "name": "王工的安全帽", "lat": 34.293, "lng": 109.146, "company": "中铁隧道局", "project": "西安地铁10号线", "status": "online",  "holder": "王五", "holderPhone": "136****9012", "lastUpdate": _now_iso},
    {"id": "2002", "name": "李工的定位器", "lat": 34.291, "lng": 109.144, "company": "中铁隧道局", "project": "西安地铁10号线", "status": "online",  "holder": "李四", "holderPhone": "139****5678", "lastUpdate": _now_iso},
    {"id": "2003", "name": "张工的安全帽", "lat": 34.295, "lng": 109.148, "company": "中铁隧道局", "project": "西安地铁10号线", "status": "offline", "holder": "张三", "holderPhone": "138****1234", "lastUpdate": _now_iso},
    {"id": "2004", "name": "赵工的定位器", "lat": 34.289, "lng": 109.142, "company": "中铁隧道局", "project": "西安地铁10号线", "status": "online",  "holder": "赵六", "holderPhone": "137****3456", "lastUpdate": _now_iso},
    {"id": "2005", "name": "孙工的安全帽", "lat": 34.294, "lng": 109.147, "company": "中铁隧道局", "project": "西安地铁10号线", "status": "online",  "holder": "孙七", "holderPhone": "135****7890", "lastUpdate": _now_iso},
    # ---- 真实定位器（固定信息，坐标会被 JT808 实时覆盖）----
    {"id": "2556", "name": "实时测试定位器", "lat": 34.28, "lng": 109.13, "company": "中铁一局", "project": "西安地铁8号线", "status": "online", "holder": "测试", "holderPhone": "14084725763", "lastUpdate": _now_iso},
]

REGIONS: List[dict] = [
    {
        "id": "region1",
        "name": "8号线施工区",
        "company": "中铁一局",
        "project": "西安地铁8号线",
        "points": [[34.278, 109.128], [34.286, 109.128], [34.286, 109.138], [34.278, 109.138]],
    },
]

WORK_TEAMS: List[dict] = [
    {
        "id": "team1",
        "name": "施工一队",
        "color": "text-blue-400",
        "fence_ids": ["1"]
    },
    {
        "id": "team2",
        "name": "施工二队",
        "color": "text-purple-400",
        "fence_ids": []
    },
    {
        "id": "team3",
        "name": "特种作业队",
        "color": "text-amber-400",
        "fence_ids": ["2", "3"]
    },
]


# ============================================================
#  围栏接口
# ============================================================

@router.get("/list", response_model=List[FenceItem])
def get_fences():
    """获取所有围栏"""
    # 通过服务层获取围栏数据
    fences = fence_service.get_fences()
    # 转换数据格式为前端需要的格式
    result = []
    for fence in fences:
        fence_item = {
            "id": fence.get("fence_id"),
            "name": fence.get("name"),
            "company": fence.get("company"),
            "project": fence.get("project"),
            "type": fence.get("shape").capitalize(),  # 转换为大写首字母
            "behavior": fence.get("behavior"),
            "severity": fence.get("severity"),
            "schedule": fence.get("schedule"),
            "center": fence.get("geometry", {}).get("center"),
            "radius": fence.get("geometry", {}).get("radius"),
            "points": fence.get("geometry", {}).get("points"),
            "createdAt": fence.get("createdAt"),
            "updatedAt": fence.get("updatedAt")
        }
        result.append(fence_item)
    return result


@router.get("/teams", response_model=List[WorkTeamItem])
def get_work_teams():
    """获取作业队及其围栏"""
    # 通过服务层获取围栏数据
    mongo_fences = fence_service.get_fences()
    
    # 转换围栏数据格式
    fences_dict = {}
    for fence in mongo_fences:
        fence_id = fence.get("fence_id")
        fences_dict[fence_id] = {
            "id": fence_id,
            "name": fence.get("name"),
            "company": fence.get("company"),
            "project": fence.get("project"),
            "type": fence.get("shape").capitalize(),
            "behavior": fence.get("behavior"),
            "severity": fence.get("severity"),
            "schedule": fence.get("schedule"),
            "center": fence.get("geometry", {}).get("center"),
            "radius": fence.get("geometry", {}).get("radius"),
            "points": fence.get("geometry", {}).get("points"),
            "createdAt": fence.get("createdAt"),
            "updatedAt": fence.get("updatedAt")
        }
    
    # 保持原有的作业队数据结构
    result = []
    for team in WORK_TEAMS:
        # 组装作业队下的围栏数据
        team_fences = [fences_dict.get(fence_id) for fence_id in team["fence_ids"] if fence_id in fences_dict]
        result.append({
            "id": team["id"],
            "name": team["name"],
            "color": team["color"],
            "fences": team_fences
        })
    return result


@router.post("/add", response_model=FenceItem)
def add_fence(payload: FenceCreate):
    """新建围栏"""
    # 构建坐标JSON
    if payload.shape == "circle" and payload.center:
        coordinates_json = json.dumps(payload.center)
    elif payload.shape == "polygon" and payload.points:
        coordinates_json = json.dumps(payload.points)
    else:
        # 确保coordinates_json至少是一个空数组的JSON格式，避免Pydantic验证错误
        coordinates_json = "[]"

    # 构建FenceCreate对象
    from app.schemas.fence_schema import FenceCreate as ServiceFenceCreate
    from app.schemas.fence_schema import AlarmLevel

    # 转换严重程度为AlarmLevel
    severity_map = {
        "normal": AlarmLevel.LOW,
        "risk": AlarmLevel.MEDIUM,
        "severe": AlarmLevel.HIGH
    }
    alarm_type = severity_map.get(payload.severity, AlarmLevel.MEDIUM)

    # 构建服务层需要的FenceCreate对象
    # 确保shape值是'polygon'或'circle'，因为ServiceFenceCreate的shape字段是枚举类型
    service_shape = payload.shape
    if service_shape != "circle":
        service_shape = "polygon"

    service_payload = ServiceFenceCreate(
        name=payload.name,
        project_region_id=None,
        shape=service_shape,
        behavior=payload.behavior,
        coordinates_json=coordinates_json,
        radius=payload.radius,
        effective_time="00:00-23:59",
        remark="",
        alarm_type=alarm_type
    )

    # 通过服务层添加围栏
    new_fence = fence_service.create_fence(service_payload, company=payload.company, project=payload.project)

    # 转换为前端需要的格式
    result = {
        "id": new_fence.get("fence_id"),
        "name": new_fence.get("name"),
        "company": new_fence.get("company", ""),
        "project": new_fence.get("project", ""),
        "type": new_fence.get("shape").capitalize(),
        "behavior": new_fence.get("behavior"),
        "severity": new_fence.get("severity"),
        "schedule": new_fence.get("schedule"),
        "center": new_fence.get("geometry", {}).get("center"),
        "radius": new_fence.get("geometry", {}).get("radius"),
        "points": new_fence.get("geometry", {}).get("points"),
        "createdAt": new_fence.get("createdAt"),
        "updatedAt": new_fence.get("updatedAt")
    }
    return result

# 新增：处理前端新的API格式
class FenceCreateNew(BaseModel):
    name: str
    project_region_id: Optional[int] = None
    shape: str  # "polygon" | "circle"
    behavior: str  # "No Entry" | "No Exit"
    coordinates_json: str
    radius: Optional[float] = None
    effective_time: str
    remark: Optional[str] = None
    alarm_type: str  # "high" | "medium" | "low"
    deviceIds: Optional[List[str]] = None

@router.post("/", response_model=FenceItem)
def create_fence_new(payload: FenceCreateNew):
    """新建围栏（新API格式）"""
    # 解析坐标JSON
    coordinates_json = payload.coordinates_json
    try:
        coordinates = json.loads(coordinates_json)
    except:
        # 如果不是有效的JSON，使用空数组
        coordinates = []
        coordinates_json = "[]"

    # 构建FenceCreate对象
    from app.schemas.fence_schema import FenceCreate as ServiceFenceCreate
    from app.schemas.fence_schema import AlarmLevel

    # 转换alarm_type为AlarmLevel
    alarm_type_map = {
        "low": AlarmLevel.LOW,
        "medium": AlarmLevel.MEDIUM,
        "high": AlarmLevel.HIGH
    }
    alarm_type = alarm_type_map.get(payload.alarm_type, AlarmLevel.MEDIUM)

    # 构建服务层需要的FenceCreate对象
    # 确保shape值是'polygon'或'circle'，因为ServiceFenceCreate的shape字段是枚举类型
    service_shape = payload.shape
    if service_shape != "circle":
        service_shape = "polygon"

    service_payload = ServiceFenceCreate(
        name=payload.name,
        project_region_id=payload.project_region_id,
        shape=service_shape,
        behavior=payload.behavior,
        coordinates_json=coordinates_json,
        radius=payload.radius,
        effective_time=payload.effective_time,
        remark=payload.remark or "",
        alarm_type=alarm_type
    )

    # 通过服务层添加围栏
    new_fence = fence_service.create_fence(service_payload, company="", project="")

    # 转换为前端需要的格式
    result = {
        "id": new_fence.get("fence_id"),
        "name": new_fence.get("name"),
        "company": new_fence.get("company", ""),
        "project": new_fence.get("project", ""),
        "type": new_fence.get("shape").capitalize(),
        "behavior": new_fence.get("behavior"),
        "severity": new_fence.get("severity"),
        "schedule": new_fence.get("schedule"),
        "center": new_fence.get("geometry", {}).get("center"),
        "radius": new_fence.get("geometry", {}).get("radius"),
        "points": new_fence.get("geometry", {}).get("points"),
        "createdAt": new_fence.get("createdAt"),
        "updatedAt": new_fence.get("updatedAt")
    }
    return result


@router.delete("/delete/{fence_id}")
def delete_fence(fence_id: str):
    """删除围栏"""
    # 通过服务层删除围栏
    success = fence_service.delete_fence(fence_id)
    if not success:
        raise HTTPException(status_code=404, detail="Fence not found")
    return {"status": "success"}


# ============================================================
#  设备接口 —— 静态数据 + JT808 实时坐标合并
# ============================================================

@router.get("/devices", response_model=List[DeviceItem])
def get_devices():
    """
    获取所有定位设备列表。
    对于 JT808 真实设备，如果有实时上报的坐标，会自动覆盖。
    """
    result = copy.deepcopy(DEVICES)
    now_iso = datetime.now().isoformat()

    # 遍历 JT808 管理器中的实时设备，合并坐标
    for phone, dev_data in jt808_manager.device_store.items():
        lat = dev_data.get("last_latitude")
        lng = dev_data.get("last_longitude")
        is_online = dev_data.get("is_online", False)

        if lat is not None and lng is not None:
            # 尝试匹配到已有静态设备（通过 holderPhone 或 id 匹配）
            matched = False
            for d in result:
                if d["holderPhone"] and phone.lstrip("0") in d["holderPhone"].replace("*", ""):
                    d["lat"] = lat
                    d["lng"] = lng
                    d["status"] = "online" if is_online else "offline"
                    d["lastUpdate"] = now_iso
                    matched = True
                    break

            # 如果没有匹配到，作为新设备追加
            if not matched:
                result.append({
                    "id": f"JT808-{phone}",
                    "name": dev_data.get("device_name", f"定位器-{phone}"),
                    "lat": lat,
                    "lng": lng,
                    "company": "中铁一局",
                    "project": "西安地铁8号线",
                    "status": "online" if is_online else "offline",
                    "holder": "实时设备",
                    "holderPhone": phone,
                    "lastUpdate": now_iso,
                })

    return result


# ============================================================
#  区域接口
# ============================================================

@router.get("/regions", response_model=List[RegionItem])
def get_regions():
    """获取项目区域列表"""
    return REGIONS


# ============================================================
#  🆕 定位点收集构建围栏 —— 多人异步上报
# ============================================================

COLLECTING_POINTS: List[dict] = []

class CollectPointRequest(BaseModel):
    device_id: str
    holder: str
    lat: float
    lng: float

def convex_hull(points: List[List[float]]) -> List[List[float]]:
    """Graham 扫描算法：给一堆乱序的点，算出凸包多边形边界（自动排序）"""
    if len(points) <= 3:
        return points
    
    def cross(o: List[float], a: List[float], b: List[float]) -> float:
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    
    points = sorted(points)
    lower: List[List[float]] = []
    for p in points:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    
    upper: List[List[float]] = []
    for p in reversed(points):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    
    return lower[:-1] + upper[:-1]

@router.post("/collect/point")
def collect_boundary_point(req: CollectPointRequest):
    """现场人员到达拐点时，上报一个围栏边界顶点"""
    COLLECTING_POINTS.append({
        "device_id": req.device_id,
        "holder": req.holder,
        "lat": req.lat,
        "lng": req.lng,
        "timestamp": datetime.now().isoformat(),
    })
    return {
        "status": "success",
        "collected": len(COLLECTING_POINTS),
        "can_generate": len(COLLECTING_POINTS) >= 3
    }

@router.get("/collect/points")
def get_collected_points():
    """前端轮询获取已收集的顶点列表"""
    return {
        "points": COLLECTING_POINTS,
        "count": len(COLLECTING_POINTS),
        "can_generate": len(COLLECTING_POINTS) >= 3,
    }

@router.delete("/collect/points")
def clear_collected_points():
    """清空正在收集的顶点"""
    COLLECTING_POINTS.clear()
    return {"status": "success", "message": "已清空所有收集的顶点"}

@router.delete("/collect/point/{index}")
def delete_single_point(index: int):
    """删除指定索引的顶点"""
    if 0 <= index < len(COLLECTING_POINTS):
        COLLECTING_POINTS.pop(index)
        return {"status": "success", "collected": len(COLLECTING_POINTS)}
    raise HTTPException(status_code=404, detail="顶点不存在")

@router.post("/collect/generate")
def generate_fence_from_points(payload: FenceCreate):
    """从收集的顶点生成围栏（自动调用凸包算法）"""
    if len(COLLECTING_POINTS) < 3:
        raise HTTPException(status_code=400, detail="至少需要3个顶点才能生成围栏")
    
    raw_points = [[p["lat"], p["lng"]] for p in COLLECTING_POINTS]
    sorted_points = convex_hull(raw_points)
    
    # 构建坐标JSON
    coordinates_json = json.dumps(sorted_points)

    # 构建FenceCreate对象
    from app.schemas.fence_schema import FenceCreate as ServiceFenceCreate
    from app.schemas.fence_schema import AlarmLevel

    # 转换严重程度为AlarmLevel
    severity_map = {
        "normal": AlarmLevel.LOW,
        "risk": AlarmLevel.MEDIUM,
        "severe": AlarmLevel.HIGH
    }
    alarm_type = severity_map.get(payload.severity, AlarmLevel.MEDIUM)

    # 构建服务层需要的FenceCreate对象
    service_payload = ServiceFenceCreate(
        name=payload.name,
        project_region_id=None,
        shape="polygon",
        behavior=payload.behavior,
        coordinates_json=coordinates_json,
        radius=None,
        effective_time="00:00-23:59",
        remark="",
        alarm_type=alarm_type
    )

    # 通过服务层添加围栏
    new_fence = fence_service.create_fence(service_payload, company=payload.company, project=payload.project)
    COLLECTING_POINTS.clear()

    # 转换为前端需要的格式
    result = {
        "id": new_fence.get("fence_id"),
        "name": new_fence.get("name"),
        "company": new_fence.get("company", ""),
        "project": new_fence.get("project", ""),
        "type": "Polygon",
        "behavior": new_fence.get("behavior"),
        "severity": new_fence.get("severity"),
        "schedule": new_fence.get("schedule"),
        "center": None,
        "radius": None,
        "points": new_fence.get("geometry", {}).get("points"),
        "createdAt": new_fence.get("createdAt"),
        "updatedAt": new_fence.get("updatedAt")
    }
    
    return result
