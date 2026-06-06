from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ContractBase(BaseModel):
    title: str

class ContractCreate(ContractBase):
    filename: str
    file_path: str

class ContractResponse(ContractBase):
    id: UUID
    user_id: UUID
    filename: str
    file_path: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
