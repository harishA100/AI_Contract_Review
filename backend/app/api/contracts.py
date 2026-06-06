from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import UUID
import os
from app.db.session import get_db
from app.schemas.contract import ContractResponse
from app.services import contract_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/contracts", tags=["contracts"])

@router.post("/upload", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
def upload_contract(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads a PDF contract, creates metadata records, and schedules background Gemini analysis.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF files are supported."
        )
        
    try:
        # Save file and create database contract entry with status 'uploaded'
        db_contract = contract_service.create_contract(
            db=db, 
            file=file, 
            title=title, 
            user_id=current_user.id
        )
        
        # Run the extraction and AI analysis pipeline asynchronously in the background
        background_tasks.add_task(
            contract_service.run_contract_analysis_pipeline, 
            db, 
            db_contract.id
        )
        
        return db_contract
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while uploading the contract: {str(e)}"
        )

@router.get("", response_model=list[ContractResponse])
def list_contracts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists all contracts belonging to the current user.
    """
    return contract_service.get_contracts_by_user(db, user_id=current_user.id)

@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves metadata for a specific contract.
    """
    contract = contract_service.get_contract_by_id(
        db, 
        contract_id=contract_id, 
        user_id=current_user.id
    )
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found."
        )
    return contract

@router.get("/{contract_id}/view")
def view_contract_pdf(
    contract_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Serves the physical PDF file for viewing, verifying that the current user owns it.
    """
    contract = contract_service.get_contract_by_id(
        db, 
        contract_id=contract_id, 
        user_id=current_user.id
    )
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found."
        )
    if not os.path.exists(contract.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical contract file not found on disk."
        )
    return FileResponse(contract.file_path, media_type="application/pdf")

@router.delete("/{contract_id}", status_code=status.HTTP_200_OK)
def delete_contract(
    contract_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a contract and its associated physical file and database records.
    """
    success = contract_service.delete_contract(
        db, 
        contract_id=contract_id, 
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found or could not be deleted."
        )
    return {"message": "Contract deleted successfully."}
