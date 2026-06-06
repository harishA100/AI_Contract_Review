import uuid
from datetime import datetime
from sqlalchemy import Text, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("contracts.id", ondelete="CASCADE"), 
        unique=True, 
        nullable=False
    )
    summary: Mapped[str] = mapped_column(
        Text, 
        nullable=False
    )
    key_clauses: Mapped[dict] = mapped_column(
        JSON, 
        nullable=False
    )
    payment_terms: Mapped[dict] = mapped_column(
        JSON, 
        nullable=False
    )
    termination_conditions: Mapped[dict] = mapped_column(
        JSON, 
        nullable=False
    )
    obligations: Mapped[dict] = mapped_column(
        JSON, 
        nullable=False
    )
    risk_assessment: Mapped[dict] = mapped_column(
        JSON, 
        nullable=False
    )
    risk_score: Mapped[int] = mapped_column(
        Integer, 
        nullable=False, 
        default=0
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow, 
        nullable=False
    )

    # Relationships
    contract: Mapped["Contract"] = relationship("Contract", back_populates="analysis")
