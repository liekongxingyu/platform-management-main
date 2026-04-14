from sqlalchemy.orm import Session
from app.models.group_call import GroupCallSession
from app.utils.logger import get_logger
from app.services.jt808_service import jt808_manager

logger = get_logger("GroupCallService")

class GroupCallService:
    def initiate_call(self, db: Session, initiator_id: int, member_ids: list):
        logger.info(f"User {initiator_id} starting group call with members {member_ids}")
        # Logic to create room, notify members (WebSocket/Push)
        pass

    def send_tts(self, text: str, target_phones: list[str]):
        logger.info(f"Sending JT808 TTS to {len(target_phones)} target(s)")
        return jt808_manager.send_tts_batch(target_phones, text)
