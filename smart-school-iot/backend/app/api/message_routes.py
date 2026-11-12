import threading
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database.connection import get_db, SessionLocal
from ..models.user import User
from ..models.school import School
from ..models.message import Message
from ..schemas.all_schemas import MessageSendRequest, MessageResponse
from ..auth.deps import get_current_user
from ..services.email_service import send_message_email
from ..services.audit_service import log_audit

router = APIRouter(prefix="/api/messages", tags=["Messages & Email Notifications"])

def _send_email_background(
    message_id: int,
    recipient_email: str,
    recipient_name: str,
    sender_name: str,
    sender_role: str,
    sender_school_name: str,
    subject: str,
    content: str,
    priority: str
):
    """
    Background worker that performs the SMTP dispatch and updates the message record.
    """
    print(f"\n>>> [SMTP Dispatcher] Sending email to '{recipient_name}' <{recipient_email}>...")
    try:
        success, detail = send_message_email(
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            sender_name=sender_name,
            sender_role=sender_role,
            sender_school_name=sender_school_name,
            subject=subject,
            content=content,
            priority=priority
        )
        print(f">>> [SMTP Dispatcher] Result for {recipient_email}: Success={success} | Detail: {detail}")
        
        db = SessionLocal()
        try:
            msg = db.query(Message).filter(Message.id == message_id).first()
            if msg:
                msg.email_sent = success
                msg.email_error = None if success else str(detail)
                db.commit()
                print(f">>> [SMTP Dispatcher] Updated Message ID {message_id} in database (email_sent={success})")
        finally:
            db.close()
    except Exception as e:
        print(f">>> [SMTP Dispatcher Error] Unexpected exception: {e}")


@router.get("/recipients")
def get_allowed_recipients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns valid recipient targets based on the logged-in user's role:
    - ADMIN: All active schools + all active inspectors
    - SCHOOL: Central Admin + assigned inspectors for this school
    - INSPECTOR: Central Admin + all schools assigned to this inspector
    """
    admin_user = db.query(User).filter(User.role == "ADMIN", User.status == "ACTIVE").first()
    admin_contact = {
        "role": "ADMIN",
        "user_id": admin_user.id if admin_user else None,
        "name": admin_user.full_name if admin_user else "State Monitoring Administration",
        "email": admin_user.email if admin_user else "admin@gmail.com",
        "label": f"Central Admin ({admin_user.email if admin_user else 'admin@gmail.com'})"
    }

    if current_user.role == "ADMIN":
        # Schools
        schools = db.query(School).filter(School.status == "ACTIVE").order_by(School.name).all()
        school_list = [
            {
                "role": "SCHOOL",
                "school_id": s.id,
                "name": s.name,
                "email": s.email,
                "principal_name": s.principal_name,
                "label": f"{s.name} ({s.email})"
            }
            for s in schools
        ]
        # Inspectors
        inspectors = db.query(User).filter(User.role == "INSPECTOR", User.status == "ACTIVE").order_by(User.full_name).all()
        inspector_list = [
            {
                "role": "INSPECTOR",
                "user_id": i.id,
                "name": i.full_name,
                "email": i.email,
                "district": i.district,
                "label": f"Inspector {i.full_name} ({i.email})"
            }
            for i in inspectors
        ]
        return {
            "schools": school_list,
            "inspectors": inspector_list,
            "admin": None
        }

    elif current_user.role == "SCHOOL":
        school_id = current_user.school_id
        school = db.query(School).filter(School.id == school_id).first()
        
        # Assigned inspectors for this school
        assigned_inspectors = []
        if school:
            for inspector in school.assigned_inspectors:
                if inspector.status == "ACTIVE":
                    assigned_inspectors.append({
                        "role": "INSPECTOR",
                        "user_id": inspector.id,
                        "name": inspector.full_name,
                        "email": inspector.email,
                        "district": inspector.district,
                        "label": f"Assigned Inspector: {inspector.full_name} ({inspector.email})"
                    })

        return {
            "admin": admin_contact,
            "inspectors": assigned_inspectors,
            "schools": []
        }

    elif current_user.role == "INSPECTOR":
        # Assigned schools
        assigned_schools = [
            {
                "role": "SCHOOL",
                "school_id": s.id,
                "name": s.name,
                "email": s.email,
                "principal_name": s.principal_name,
                "label": f"{s.name} ({s.email})"
            }
            for s in current_user.assigned_schools
            if s.status == "ACTIVE"
        ]

        return {
            "admin": admin_contact,
            "schools": assigned_schools,
            "inspectors": []
        }

    return {"admin": None, "schools": [], "inspectors": []}

@router.post("/send", response_model=MessageResponse)
def send_message(
    payload: MessageSendRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sends an in-system message and dispatches an instant SMTP email notification.
    Enforces role hierarchy:
    - Admin -> School or Inspector
    - School -> Admin or Assigned Inspector
    - Inspector -> Admin or Assigned School
    """
    recipient_role = payload.recipient_role.upper()
    recipient_name = ""
    recipient_email = ""
    recipient_school_id = None
    recipient_user_id = None

    sender_school_name = None
    if current_user.school:
        sender_school_name = current_user.school.name

    # 1. ADMIN Recipient
    if recipient_role == "ADMIN":
        admin_user = db.query(User).filter(User.role == "ADMIN", User.status == "ACTIVE").first()
        if not admin_user:
            raise HTTPException(status_code=404, detail="Admin user not found")
        recipient_user_id = admin_user.id
        recipient_name = admin_user.full_name
        recipient_email = admin_user.email

    # 2. SCHOOL Recipient
    elif recipient_role == "SCHOOL":
        if not payload.recipient_school_id:
            raise HTTPException(status_code=400, detail="recipient_school_id is required for school recipients")
        
        target_school = db.query(School).filter(School.id == payload.recipient_school_id).first()
        if not target_school:
            raise HTTPException(status_code=404, detail="Target school not found")

        # Permission check: Inspector can only message assigned schools
        if current_user.role == "INSPECTOR":
            assigned_ids = [s.id for s in current_user.assigned_schools]
            if target_school.id not in assigned_ids:
                raise HTTPException(status_code=403, detail="You can only send messages to schools assigned to you")
        elif current_user.role == "SCHOOL":
            raise HTTPException(status_code=403, detail="Schools cannot message other schools directly")

        recipient_school_id = target_school.id
        recipient_name = target_school.principal_name or target_school.name
        recipient_email = target_school.email

    # 3. INSPECTOR Recipient
    elif recipient_role == "INSPECTOR":
        if not payload.recipient_user_id:
            raise HTTPException(status_code=400, detail="recipient_user_id is required for inspector recipients")
        
        target_inspector = db.query(User).filter(
            User.id == payload.recipient_user_id,
            User.role == "INSPECTOR"
        ).first()
        if not target_inspector:
            raise HTTPException(status_code=404, detail="Target inspector not found")

        # Permission check: School can only message inspectors assigned to it
        if current_user.role == "SCHOOL":
            school = db.query(School).filter(School.id == current_user.school_id).first()
            if not school or target_inspector not in school.assigned_inspectors:
                raise HTTPException(status_code=403, detail="You can only message inspectors assigned to your school")
        elif current_user.role == "INSPECTOR":
            raise HTTPException(status_code=403, detail="Inspectors cannot message other inspectors directly")

        recipient_user_id = target_inspector.id
        recipient_name = target_inspector.full_name
        recipient_email = target_inspector.email

    else:
        raise HTTPException(status_code=400, detail=f"Invalid recipient role: {recipient_role}")

    # Allow custom recipient email (e.g. if tester wants to direct email to their own address)
    if payload.recipient_email and "@" in payload.recipient_email:
        recipient_email = payload.recipient_email.strip()

    # Create Message Record
    new_message = Message(
        sender_id=current_user.id,
        sender_role=current_user.role,
        sender_name=current_user.full_name,
        sender_email=current_user.email,
        sender_school_id=current_user.school_id,
        sender_school_name=sender_school_name,
        recipient_role=recipient_role,
        recipient_user_id=recipient_user_id,
        recipient_school_id=recipient_school_id,
        recipient_name=recipient_name,
        recipient_email=recipient_email,
        subject=payload.subject.strip(),
        content=payload.content.strip(),
        priority=payload.priority or "NORMAL",
        is_read=False,
        email_sent=False
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # Dispatch background task for SMTP email notification
    if payload.send_email and recipient_email:
        background_tasks.add_task(
            _send_email_background,
            new_message.id,
            recipient_email,
            recipient_name,
            current_user.full_name,
            current_user.role,
            sender_school_name,
            new_message.subject,
            new_message.content,
            new_message.priority
        )

    try:
        log_audit(
            db=db,
            action="MESSAGE_SENT",
            details=f"Sent '{payload.subject}' to {recipient_name} ({recipient_role}, {recipient_email})",
            user_email=current_user.email,
            school_id=current_user.school_id or recipient_school_id,
            user_id=current_user.id
        )
    except Exception as e:
        print(f"Notice: Failed to log audit for message: {e}")

    return new_message

@router.get("/inbox", response_model=List[MessageResponse])
def get_inbox(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns messages sent to the current user or their school.
    """
    query = db.query(Message)

    if current_user.role == "ADMIN":
        query = query.filter(
            or_(
                Message.recipient_role == "ADMIN",
                Message.recipient_user_id == current_user.id,
                Message.recipient_email == current_user.email
            )
        )
    elif current_user.role == "SCHOOL":
        school_id = current_user.school_id
        school = db.query(School).filter(School.id == school_id).first()
        school_email = school.email if school else ""
        query = query.filter(
            or_(
                Message.recipient_school_id == school_id,
                Message.recipient_email == current_user.email,
                Message.recipient_email == school_email
            )
        )
    elif current_user.role == "INSPECTOR":
        query = query.filter(
            or_(
                Message.recipient_user_id == current_user.id,
                Message.recipient_email == current_user.email
            )
        )

    messages = query.order_by(Message.created_at.desc()).all()
    return messages

@router.get("/sent", response_model=List[MessageResponse])
def get_sent_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns messages sent by the current user.
    """
    messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.sender_email == current_user.email
        )
    ).order_by(Message.created_at.desc()).all()
    return messages

@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns count of unread messages in inbox.
    """
    query = db.query(Message).filter(Message.is_read == False)

    if current_user.role == "ADMIN":
        query = query.filter(
            or_(
                Message.recipient_role == "ADMIN",
                Message.recipient_user_id == current_user.id,
                Message.recipient_email == current_user.email
            )
        )
    elif current_user.role == "SCHOOL":
        school_id = current_user.school_id
        school = db.query(School).filter(School.id == school_id).first()
        school_email = school.email if school else ""
        query = query.filter(
            or_(
                Message.recipient_school_id == school_id,
                Message.recipient_email == current_user.email,
                Message.recipient_email == school_email
            )
        )
    elif current_user.role == "INSPECTOR":
        query = query.filter(
            or_(
                Message.recipient_user_id == current_user.id,
                Message.recipient_email == current_user.email
            )
        )

    return {"unread_count": query.count()}

@router.put("/{message_id}/read")
def mark_message_as_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks a message as read.
    """
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    msg.is_read = True
    db.commit()
    return {"status": "success", "message_id": message_id, "is_read": True}
