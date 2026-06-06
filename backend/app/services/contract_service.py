import os
import uuid
import logging
from sqlalchemy.orm import Session
from app.models.contract import Contract
from app.models.analysis import Analysis
from app.core.config import settings
from app.services.extractor import extract_text_from_pdf
from app.services.gemini import analyze_contract_text
from fastapi import UploadFile

logger = logging.getLogger(__name__)

def create_contract(db: Session, file: UploadFile, title: str, user_id: uuid.UUID) -> Contract:
    """
    Saves the uploaded file securely on disk and creates a Contract record in the database.
    """
    # Verify file is a PDF
    if not file.filename.lower().endswith('.pdf'):
        raise ValueError("Only PDF files are supported.")
        
    # Create secure UUID filename to prevent collisions and directory traversal
    file_id = uuid.uuid4()
    filename = f"{file_id}.pdf"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    # Save physical file
    try:
        with open(file_path, "wb") as f:
            content = file.file.read()
            f.write(content)
    except Exception as e:
        logger.error(f"Failed to write uploaded file to disk: {e}")
        raise IOError(f"Could not save file to disk: {str(e)}")
        
    # Create database entry
    db_contract = Contract(
        id=file_id,
        user_id=user_id,
        title=title,
        filename=file.filename,
        file_path=file_path,
        status="uploaded"
    )
    
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

def run_contract_analysis_pipeline(db: Session, contract_id: uuid.UUID) -> None:
    """
    Executes the text extraction and Gemini AI analysis pipeline.
    This runs asynchronously in the background.
    """
    # Fetch contract in a clean database session context
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        logger.error(f"Contract {contract_id} not found in database for background analysis.")
        return

    logger.info(f"Starting background analysis pipeline for contract: {contract.title} ({contract_id})")
    
    # Update status to processing
    contract.status = "processing"
    db.commit()
    db.refresh(contract)
    
    try:
        # 1. Extract text from PDF
        logger.info(f"Extracting text from PDF for contract {contract_id}")
        extracted_text = extract_text_from_pdf(contract.file_path)
        
        if not extracted_text.strip():
            raise ValueError("Extracted text is empty. PDF might be scanned or image-only.")
            
        # 2. Analyze using Gemini
        logger.info(f"Sending text to Gemini for analysis for contract {contract_id}")
        analysis_data = analyze_contract_text(extracted_text)
        
        # 3. Create analysis entry
        db_analysis = Analysis(
            contract_id=contract.id,
            summary=analysis_data["summary"],
            key_clauses=analysis_data["key_clauses"],
            payment_terms=analysis_data["payment_terms"],
            termination_conditions=analysis_data["termination_conditions"],
            obligations=analysis_data["obligations"],
            risk_assessment=analysis_data["risk_assessment"],
            risk_score=analysis_data["risk_score"]
        )
        
        db.add(db_analysis)
        
        # Update contract status
        contract.status = "analyzed"
        db.commit()
        logger.info(f"Analysis pipeline successfully completed for contract {contract_id}")
        
    except Exception as e:
        logger.error(f"Analysis pipeline failed for contract {contract_id}: {e}")
        contract.status = "failed"
        db.commit()

def get_contracts_by_user(db: Session, user_id: uuid.UUID) -> list[Contract]:
    """
    Returns all contracts uploaded by a user.
    """
    return db.query(Contract).filter(Contract.user_id == user_id).order_by(Contract.created_at.desc()).all()

def get_contract_by_id(db: Session, contract_id: uuid.UUID, user_id: uuid.UUID) -> Contract:
    """
    Returns a specific contract by ID, verifying that the user owns it.
    """
    return db.query(Contract).filter(Contract.id == contract_id, Contract.user_id == user_id).first()

def delete_contract(db: Session, contract_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """
    Deletes a contract and its associated analysis, removing the physical file from disk.
    """
    contract = get_contract_by_id(db, contract_id, user_id)
    if not contract:
        return False
        
    # Delete physical file from disk
    if os.path.exists(contract.file_path):
        try:
            os.remove(contract.file_path)
        except Exception as e:
            logger.error(f"Failed to delete physical file {contract.file_path} from disk: {e}")
            # We will proceed with deleting DB records even if disk removal fails
            
    # Delete database record (cascading deletes analysis in DB due to ForeignKey setup)
    db.delete(contract)
    db.commit()
    return True
