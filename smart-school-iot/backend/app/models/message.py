from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    
    # Sender information
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sender_role = Column(String(50), nullable=False) # ADMIN, SCHOOL, INSPECTOR
    sender_name = Column(String(150), nullable=False)
    sender_email = Column(String(150), nullable=False)
    sender_school_id = Column(Integer, ForeignKey("schools.id", ondelete="SET NULL"), nullable=True)
    sender_school_name = Column(String(255), nullable=True)
    
    # Recipient information
    recipient_role = Column(String(50), nullable=False) # ADMIN, SCHOOL, INSPECTOR
    recipient_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    recipient_school_id = Column(Integer, ForeignKey("schools.id", ondelete="SET NULL"), nullable=True)
    recipient_name = Column(String(150), nullable=False)
    recipient_email = Column(String(150), nullable=False)
    
    # Message content
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(50), default="NORMAL") # NORMAL, URGENT, NOTICE
    
    # Status
    is_read = Column(Boolean, default=False)
    email_sent = Column(Boolean, default=False)
    email_error = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient_user = relationship("User", foreign_keys=[recipient_user_id])
    recipient_school = relationship("School", foreign_keys=[recipient_school_id])
