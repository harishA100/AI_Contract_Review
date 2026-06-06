from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Dict, Any, List

class AnalysisBase(BaseModel):
    summary: str
    key_clauses: List[Dict[str, Any]]
    payment_terms: List[Dict[str, Any]]
    termination_conditions: List[Dict[str, Any]]
    obligations: List[Dict[str, Any]]
    risk_assessment: List[Dict[str, Any]]
    risk_score: int

class AnalysisResponse(AnalysisBase):
    id: UUID
    contract_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
