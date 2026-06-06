import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
from typing import Optional

class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    title: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    filename: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    file_path: Mapped[str] = mapped_column(
        String(512), 
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), 
        default="uploaded", # "uploaded", "processing", "analyzed", "failed"
        nullable=False
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
    user: Mapped["User"] = relationship("User", back_populates="contracts")
    analysis: Mapped[Optional["Analysis"]] = relationship(
        "Analysis", 
        back_populates="contract", 
        cascade="all, delete-orphan",
        uselist=False
    )
