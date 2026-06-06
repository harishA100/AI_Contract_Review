from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import get_db
from app.schemas.analysis import AnalysisResponse
from app.services import contract_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/analyses", tags=["analyses"])

@router.get("/{contract_id}", response_model=AnalysisResponse)
def get_contract_analysis(
    contract_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the Gemini AI analysis results for a specific contract.
    Checks ownership and returns 202 if analysis is still in progress.
    """
    # 1. Fetch contract first to verify ownership
    contract = contract_service.get_contract_by_id(
        db, 
        contract_id=contract_id, 
        user_id=current_user.id
    )
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found or access denied."
        )
        
    # 2. Check if contract analysis exists
    if not contract.analysis:
        if contract.status in ("processing", "uploaded"):
            raise HTTPException(
                status_code=status.HTTP_202_ACCEPTED,
                detail="Analysis is still in progress. Please check again shortly."
            )
        elif contract.status == "failed":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Analysis failed during text extraction or AI generation."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found for this contract."
            )
            
    return contract.analysis
