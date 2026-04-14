from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.device import Device
from app.schemas.device_schema import DeviceOut, DeviceCreate, DeviceUpdate
from app.services.jt808_service import jt808_manager

router = APIRouter(prefix="/devices", tags=["Devices"])

@router.get("/", response_model=list[DeviceOut])
def get_devices(db: Session = Depends(get_db)):
    db_devices = db.query(Device).all()
    
    # 将 JT808 内存设备合并到返回列表
    for phone, m_dev in jt808_manager.device_store.items():
        temp_dev = Device(
            id=m_dev.get("phone", phone),
            device_name=m_dev.get("device_name", f"定位器-{phone}"),
            device_type="JT808",
            ip_address="0.0.0.0",
            port=8989,
            stream_url=phone,
            is_online=m_dev.get("is_online", False),
            last_latitude=m_dev.get("last_latitude"),
            last_longitude=m_dev.get("last_longitude"),
            owner_id=1,
        )
        existing = next((d for d in db_devices if d.id == temp_dev.id), None)
        if existing:
            existing.last_latitude = m_dev.get("last_latitude") or existing.last_latitude
            existing.last_longitude = m_dev.get("last_longitude") or existing.last_longitude
            existing.is_online = m_dev.get("is_online", False)
        else:
            db_devices.append(temp_dev)
    
    return db_devices

@router.post("/", response_model=DeviceOut)
def create_device(device_in: DeviceCreate, db: Session = Depends(get_db)):
    db_device = Device(**device_in.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@router.put("/{device_id}", response_model=DeviceOut)
def update_device(device_id: str, device_in: DeviceUpdate, db: Session = Depends(get_db)):
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Device not found")
    
    update_data = device_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_device, key, value)
    
    db.commit()
    db.refresh(db_device)
    return db_device

@router.delete("/{device_id}")
def delete_device(device_id: str, db: Session = Depends(get_db)):
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Device not found")
    
    db.delete(db_device)
    db.commit()
    return {"status": "success"}
