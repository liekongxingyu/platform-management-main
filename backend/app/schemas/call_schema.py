from pydantic import BaseModel, Field
from typing import List

class CallCreate(BaseModel):
    initiator_id: int
    member_ids: List[int]


class TtsSendRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to be spoken by JT808 terminals")
    target_phones: List[str] = Field(default_factory=list, description="Target JT808 phone numbers")
