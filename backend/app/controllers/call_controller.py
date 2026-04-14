from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.call_schema import CallCreate, TtsSendRequest
from app.services.call_service import GroupCallService

router = APIRouter(prefix="/call", tags=["Group Call"])
service = GroupCallService()

@router.post("/initiate")
def start_group_call(call_data: CallCreate, db: Session = Depends(get_db)):
    service.initiate_call(db, call_data.initiator_id, call_data.member_ids)
    return {"message": "Call initiated", "room_id": "123-456"}


@router.post("/tts/send")
def send_group_tts(payload: TtsSendRequest):
    text = payload.text.strip()
    target_phones = [phone.strip() for phone in payload.target_phones if phone and phone.strip()]

    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    if not target_phones:
        raise HTTPException(status_code=400, detail="No target devices selected")

    result = service.send_tts(text, target_phones)
    if result["success_count"] == 0:
        raise HTTPException(status_code=400, detail=result)

    return result
