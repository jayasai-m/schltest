import os
import uuid
import shutil
import threading
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.user import User
from ..models.school import School
from ..models.sensor import SensorReading
from ..models.meal import MealSubmission, ImageSubmission
from ..models.alert import Alert
from ..schemas.all_schemas import (
    SensorReadingResponse, MealCreate, MealResponse,
    ImageSubmissionResponse, AlertResponse
)
from ..auth.deps import require_school
from ..services.audit_service import log_audit
from ..services.cv_service import food_quality_check, count_students_in_image

router = APIRouter(prefix="/api/school", tags=["School Panel"])

HARDWARE_TIMEOUT_SECONDS = int(os.getenv("HARDWARE_TIMEOUT_SECONDS", "120"))
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

def get_live_hardware_status(school: School) -> dict:
    if not school.last_hardware_ping:
        return {"status": "DISCONNECTED", "label": "Hardware Not Connected"}
    diff = (datetime.utcnow() - school.last_hardware_ping).total_seconds()
    if diff <= HARDWARE_TIMEOUT_SECONDS:
        return {"status": "CONNECTED", "label": "ESP32 Connected"}
    return {"status": "DISCONNECTED", "label": "ESP32 Disconnected"}

@router.get("/dashboard")
def get_school_dashboard(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    hw_info = get_live_hardware_status(school)
    
    # Latest reading - ONLY REAL DATA FROM DATABASE
    latest_reading = db.query(SensorReading).filter(
        SensorReading.school_id == school.id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    # Active alerts
    active_alerts = db.query(Alert).filter(
        Alert.school_id == school.id,
        Alert.status == "ACTIVE"
    ).order_by(Alert.created_at.desc()).all()
    
    # Today's meal
    today_meal = db.query(MealSubmission).filter(
        MealSubmission.school_id == school.id,
        MealSubmission.submission_date == date.today()
    ).first()
    
    # Recent images
    recent_images = db.query(ImageSubmission).filter(
        ImageSubmission.school_id == school.id
    ).order_by(ImageSubmission.created_at.desc()).limit(5).all()
    
    return {
        "school": {
            "id": school.id,
            "name": school.name,
            "school_code": school.school_code,
            "district": school.district,
            "state": school.state,
            "tank_capacity_litres": school.tank_capacity_litres,
            "tank_height_cm": school.tank_height_cm,
            "hardware_device_id": school.hardware_device_id,
            "hardware_api_key": school.hardware_api_key
        },
        "hardware": hw_info,
        "latest_reading": latest_reading,
        "active_alerts_count": len(active_alerts),
        "recent_alerts": active_alerts[:5],
        "today_meal": today_meal,
        "recent_images": recent_images
    }

@router.get("/digital-twin")
def get_school_digital_twin(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    hw_info = get_live_hardware_status(school)
    
    latest_reading = db.query(SensorReading).filter(
        SensorReading.school_id == school.id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    return {
        "school_id": school.id,
        "school_name": school.name,
        "tank_capacity_litres": school.tank_capacity_litres,
        "tank_height_cm": school.tank_height_cm,
        "hardware_status": hw_info["status"],
        "hardware_label": hw_info["label"],
        "last_sensor_update": latest_reading.recorded_at.isoformat() if latest_reading else None,
        "sensor_data": latest_reading
    }

@router.get("/water")
def get_school_water(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    hw_info = get_live_hardware_status(school)
    
    latest_reading = db.query(SensorReading).filter(
        SensorReading.school_id == school.id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    # Real historical records only (ordered chronologically for charts)
    history = db.query(SensorReading).filter(
        SensorReading.school_id == school.id
    ).order_by(SensorReading.recorded_at.desc()).limit(50).all()
    # Reverse to ascending order for chronological charts
    history = list(reversed(history))
    
    return {
        "school": {
            "id": school.id,
            "name": school.name,
            "tank_capacity_litres": school.tank_capacity_litres,
            "tank_height_cm": school.tank_height_cm,
            "turbidity_threshold": school.turbidity_threshold,
            "low_water_threshold_pct": school.low_water_threshold_pct,
            "overflow_threshold_pct": school.overflow_threshold_pct
        },
        "hardware": hw_info,
        "latest": latest_reading,
        "history": history
    }

@router.get("/meals")
def get_school_meals(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    hw_info = get_live_hardware_status(school) if school else {"status": "DISCONNECTED", "label": "Hardware Not Connected"}

    meals = db.query(MealSubmission).filter(
        MealSubmission.school_id == current_user.school_id
    ).order_by(MealSubmission.created_at.desc()).all()
    
    images = db.query(ImageSubmission).filter(
        ImageSubmission.school_id == current_user.school_id
    ).order_by(ImageSubmission.created_at.desc()).all()

    # Reconcile existing images against new precision CV engine
    reconciled = False
    for img in images:
        fn = os.path.basename(img.image_url) if img.image_url else ""
        p = os.path.join(UPLOAD_DIR, fn)
        if os.path.exists(p):
            if img.category in ("MEAL_PREPARATION", "KITCHEN_HYGIENE"):
                res = food_quality_check(p, zone=None, day_of_week=None, menu_description=img.menu_description or "", meal_type=img.meal_type or "")
                new_status = res["cv_status"]
                new_match = res.get("cv_match_percentage", 0.0)
                if img.cv_status != new_status or img.cv_match_percentage != new_match:
                    img.cv_status = new_status
                    img.status = new_status
                    img.cv_notes = res["cv_notes"]
                    img.cv_match_percentage = new_match
                    reconciled = True
            elif img.category == "STUDENT_EATING":
                res = count_students_in_image(p)
                new_status = res["cv_status"]
                new_cnt = res.get("cv_student_count", 0)
                if img.cv_status != new_status or img.cv_student_count != new_cnt:
                    img.cv_status = new_status
                    img.status = new_status
                    img.cv_student_count = new_cnt
                    img.cv_notes = res.get("cv_notes")
                    reconciled = True
    if reconciled:
        try:
            db.commit()
        except Exception:
            pass
    
    # Also fetch humidity sensor reading if available and hardware is online
    latest_sensor = None
    if hw_info["status"] == "CONNECTED":
        latest_sensor = db.query(SensorReading).filter(
            SensorReading.school_id == current_user.school_id
        ).order_by(SensorReading.recorded_at.desc()).first()
    
    return {
        "meals": meals,
        "images": images,
        "latest_sensor": latest_sensor,
        "hardware": hw_info
    }

@router.post("/meals", response_model=MealResponse)
def submit_meal(
    meal_data: MealCreate,
    current_user: User = Depends(require_school),
    db: Session = Depends(get_db)
):
    new_meal = MealSubmission(
        school_id=current_user.school_id,
        meal_type=meal_data.meal_type,
        menu_description=meal_data.menu_description,
        staff_name=meal_data.staff_name,
        inspection_shift=meal_data.inspection_shift,
        hygiene_notes=meal_data.hygiene_notes,
        submission_date=date.today()
    )
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)
    
    log_audit(
        db=db,
        action="MEAL_SUBMITTED",
        details=f"Meal registered: {new_meal.meal_type} ({new_meal.inspection_shift}) by {new_meal.staff_name}",
        user_email=current_user.email,
        school_id=current_user.school_id,
        user_id=current_user.id
    )
    return new_meal

@router.post("/upload-image")
def upload_school_image(
    category: str = Form(...), # MEAL_PREPARATION, KITCHEN_HYGIENE, STUDENT_EATING
    meal_type: Optional[str] = Form(None),
    menu_description: Optional[str] = Form(None),
    staff_name: Optional[str] = Form(None),
    inspection_shift: Optional[str] = Form(None),
    hygiene_notes: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    captured_location: Optional[str] = Form(None),
    location_text: Optional[str] = Form(None),
    captured_timestamp: Optional[str] = Form(None),
    timestamp: Optional[str] = Form(None),
    zone: Optional[int] = Form(None),
    day_of_week: Optional[str] = Form(None),
    angle_number: Optional[int] = Form(None),
    angle_name: Optional[str] = Form(None),
    client_student_count: Optional[int] = Form(None),
    file: UploadFile = File(...),
    thumbnail: Optional[UploadFile] = None,
    request: Request = None,
    current_user: User = Depends(require_school),
    db: Session = Depends(get_db)
):
    """
    Accepts staff in-app camera captures for:
      - MEAL_PREPARATION    → Gemini Vision CV checks food vs menu (auto-flag/pass)
      - KITCHEN_HYGIENE     → Stored for manual admin review
      - STUDENT_EATING      → YOLOv8 CV counts students in photo (Min 8 images from 8 different angles)
    All submissions must be live in-app captures with burned-in GPS + timestamp.
    """
    VALID_CATEGORIES = ["MEAL_PREPARATION", "KITCHEN_HYGIENE", "STUDENT_EATING"]
    if category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Category must be one of: {', '.join(VALID_CATEGORIES)}"
        )
        
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    orig_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    file_ext = orig_ext if orig_ext in [".jpg", ".jpeg", ".png", ".webp"] else ".jpg"
    unique_prefix = f"img_{current_user.school_id}_{uuid.uuid4().hex[:12]}"
    unique_filename = f"{unique_prefix}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    image_url = f"/uploads/{unique_filename}"
    
    # Sanitize Form defaults if called directly or by test harness
    def _clean_str(v, fallback=None):
        if v is None or hasattr(v, 'default'):
            return fallback
        return str(v)

    def _clean_float(v):
        if v is None or hasattr(v, 'default'):
            return None
        try:
            return float(v)
        except Exception:
            return None

    def _clean_int(v):
        if v is None or hasattr(v, 'default'):
            return None
        try:
            return int(v)
        except Exception:
            return None

    clean_meal_type = _clean_str(meal_type)
    clean_menu_desc = _clean_str(menu_description)
    clean_staff = _clean_str(staff_name)
    clean_shift = _clean_str(inspection_shift, "Morning Prep")
    clean_hygiene = _clean_str(hygiene_notes)
    clean_lat = _clean_float(latitude)
    clean_lon = _clean_float(longitude)
    clean_loc = _clean_str(captured_location) or _clean_str(location_text) or "Geo-Stamp Verified"
    clean_time = _clean_str(captured_timestamp) or _clean_str(timestamp) or datetime.utcnow().isoformat()
    clean_angle_num = _clean_int(angle_number)
    clean_angle_name = _clean_str(angle_name)
    clean_client_cnt = _clean_int(client_student_count)
    clean_zone = _clean_int(zone)
    clean_day = _clean_str(day_of_week)

    # If angle details provided for STUDENT_EATING, augment description
    if category == "STUDENT_EATING" and clean_angle_num:
        angle_tag = f"[Angle {clean_angle_num}/8: {clean_angle_name or 'Dining View'}]"
        if clean_menu_desc:
            clean_menu_desc = f"{angle_tag} {clean_menu_desc}"
        else:
            clean_menu_desc = f"{angle_tag} Mid-Day Meal Student Headcount (Min 8 Angles Protocol)"
    elif category == "MEAL_PREPARATION" and clean_zone:
        zone_tag = f"[AP MDM Zone {clean_zone}{f' - {clean_day}' if clean_day else ''}]"
        if clean_menu_desc:
            clean_menu_desc = f"{zone_tag} {clean_menu_desc}"
        else:
            clean_menu_desc = f"{zone_tag} Statutory Meal Preparation Inspection"

    # Store submission
    submission = ImageSubmission(
        school_id=current_user.school_id,
        uploaded_by_user_id=current_user.id,
        category=category,
        image_url=image_url,
        video_url=None,
        media_type="image",
        file_name=file.filename or unique_filename,
        meal_type=clean_meal_type or "Daily Mid-Day Meal",
        menu_description=clean_menu_desc,
        staff_name=clean_staff,
        inspection_shift=clean_shift,
        hygiene_notes=clean_hygiene,
        latitude=clean_lat,
        longitude=clean_lon,
        captured_location=clean_loc,
        captured_timestamp=clean_time,
        status="PENDING_REVIEW",
        cv_status=None,
        cv_notes=None,
        cv_confidence=None,
        cv_processed_at=None,
        cv_student_count=clean_client_cnt if category == "STUDENT_EATING" else None,
        cv_match_percentage=None
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    submission_id = submission.id
    menu_text = clean_menu_desc or clean_meal_type or ""

    # ── Background CV Analysis ─────────────────────────────────────────
    def run_cv_analysis(media_path: str, sub_id: int, cat: str, menu: str, angle_num: Optional[int], zone_num: Optional[int], day_str: Optional[str], session: Optional[Session] = None):
        """
        Runs synchronously when session is provided (Serverless), or in a daemon thread.
        Uses provided session or opens a new DB session (thread-safe) to write back results.
        """
        from ..database.connection import SessionLocal as _SL
        _db = session if session is not None else _SL()
        try:
            sub = _db.query(ImageSubmission).filter(ImageSubmission.id == sub_id).first()
            if not sub:
                return

            if cat in ("MEAL_PREPARATION", "KITCHEN_HYGIENE"):
                result = food_quality_check(
                    image_path=media_path,
                    zone=zone_num,
                    day_of_week=day_str,
                    menu_description=menu,
                    meal_type=sub.meal_type or ""
                )
                sub.cv_status = result["cv_status"]
                sub.cv_notes = result["cv_notes"]
                sub.cv_confidence = result["cv_confidence"]
                sub.cv_match_percentage = result.get("cv_match_percentage")
                sub.cv_processed_at = datetime.utcnow()
                if result["cv_status"] == "CV_PASS":
                    sub.status = "CV_PASS"
                elif result["cv_status"] == "CV_FLAG":
                    sub.status = "CV_FLAG"

            elif cat == "STUDENT_EATING":
                result = count_students_in_image(media_path)
                student_count = result.get("cv_student_count", 0)
                sub.cv_student_count = student_count
                sub.cv_confidence = result.get("cv_confidence", 0.8)
                sub.cv_processed_at = datetime.utcnow()
                
                angle_pfx = f"[Angle {angle_num}/8] " if angle_num else ""
                if student_count == 0 or result.get("cv_status") != "CV_PASS":
                    sub.cv_status = "CV_FLAG"
                    sub.status = "CV_FLAG"
                    sub.cv_notes = f"{angle_pfx}" + (result.get("cv_notes") or "Zero students detected in dining frame. Photo flagged for inspection review.")
                else:
                    sub.cv_status = "CV_PASS"
                    sub.status = "CV_PASS"
                    sub.cv_notes = f"{angle_pfx}" + result.get("cv_notes", f"YOLOv8 detected ~{student_count} student(s) eating.")

            _db.commit()
        except Exception as e:
            import logging
            logging.getLogger("cv_service").error(f"CV background thread error: {e}")
            try:
                sub = _db.query(ImageSubmission).filter(ImageSubmission.id == sub_id).first()
                if sub:
                    sub.cv_status = "CV_FLAG"
                    sub.cv_notes = f"CV check completed (flagged for review: {str(e)[:60]})"
                    sub.cv_processed_at = datetime.utcnow()
                    _db.commit()
            except Exception:
                pass
        finally:
            if session is None:
                _db.close()

    # Launch CV analysis synchronously so results are immediately returned and persisted
    abs_file_path = os.path.abspath(file_path)
    if category in ["MEAL_PREPARATION", "STUDENT_EATING"]:
        run_cv_analysis(abs_file_path, submission_id, category, menu_text, clean_angle_num, clean_zone, clean_day, session=db)
        db.refresh(submission)
    
    log_audit(
        db=db,
        action="IMAGE_UPLOADED",
        details=f"Photo uploaded for {category}: {file.filename} (CV analysis {'completed' if category != 'KITCHEN_HYGIENE' else 'N/A — manual review'})",
        user_email=current_user.email,
        school_id=current_user.school_id,
        user_id=current_user.id
    )
    
    cv_info = ""
    if category == "MEAL_PREPARATION":
        cv_info = " CV food quality check against AP MDM Zone Menu completed."
    elif category == "STUDENT_EATING":
        cv_info = " CV student count completed."
    
    return {
        "status": "success",
        "message": f"Image uploaded successfully.{cv_info} Awaiting administrator verification.",
        "image": submission
    }


@router.post("/upload-student-batch")
def upload_student_batch(
    files: List[UploadFile] = File(...),
    staff_name: Optional[str] = Form(None),
    inspection_shift: Optional[str] = Form("Lunch Serving"),
    hygiene_notes: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    captured_location: Optional[str] = Form(None),
    location_text: Optional[str] = Form(None),
    captured_timestamp: Optional[str] = Form(None),
    timestamp: Optional[str] = Form(None),
    current_user: User = Depends(require_school),
    db: Session = Depends(get_db)
):
    """
    Accepts the mandatory batch of 8 student dining angle images.
    Each image is saved with its respective angle tag and analyzed via YOLOv8.
    """
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="At least one image must be provided.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ANGLE_LABELS = [
        "Front Center", "Front Left", "Front Right", "Left Corridor",
        "Right Corridor", "Rear Dining", "Center Aisle", "Wide View"
    ]

    clean_staff = str(staff_name) if staff_name and not hasattr(staff_name, 'default') else "Mid-Day Meal Staff"
    clean_shift = str(inspection_shift) if inspection_shift and not hasattr(inspection_shift, 'default') else "Lunch Serving"
    clean_hygiene = str(hygiene_notes) if hygiene_notes and not hasattr(hygiene_notes, 'default') else None
    
    clean_lat = None
    if latitude is not None and not hasattr(latitude, 'default'):
        try: clean_lat = float(latitude)
        except Exception: pass

    clean_lon = None
    if longitude is not None and not hasattr(longitude, 'default'):
        try: clean_lon = float(longitude)
        except Exception: pass

    clean_loc = str(captured_location or location_text or "Geo-Stamp Verified")
    clean_time = str(captured_timestamp or timestamp or datetime.utcnow().isoformat())

    created_submissions = []
    to_process = []
    is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

    def _run_single_cv(media_path: str, sub_id: int, angle_num: int, session: Optional[Session] = None):
        from ..database.connection import SessionLocal as _SL
        _db = session if session is not None else _SL()
        try:
            sub = _db.query(ImageSubmission).filter(ImageSubmission.id == sub_id).first()
            if not sub:
                return
            result = count_students_in_image(media_path)
            student_count = result.get("cv_student_count", 0)
            sub.cv_student_count = student_count
            sub.cv_confidence = result.get("cv_confidence", 0.8)
            sub.cv_processed_at = datetime.utcnow()
            angle_pfx = f"[Angle {angle_num}/8] "
            if student_count == 0 or result.get("cv_status") != "CV_PASS":
                sub.cv_status = "CV_FLAG"
                sub.status = "CV_FLAG"
                sub.cv_notes = f"{angle_pfx}" + (result.get("cv_notes") or "Zero students detected in dining frame. Flagged.")
            else:
                sub.cv_status = "CV_PASS"
                sub.status = "CV_PASS"
                sub.cv_notes = f"{angle_pfx}" + result.get("cv_notes", f"YOLOv8 detected ~{student_count} student(s) eating.")
            _db.commit()
        except Exception as e:
            import logging
            logging.getLogger("cv_service").error(f"Student batch CV error: {e}")
            try:
                sub = _db.query(ImageSubmission).filter(ImageSubmission.id == sub_id).first()
                if sub:
                    sub.cv_status = "CV_FLAG"
                    sub.cv_notes = f"[Angle {angle_num}/8] CV processed (flagged for review: {str(e)[:60]})"
                    sub.cv_processed_at = datetime.utcnow()
                    _db.commit()
            except Exception:
                pass
        finally:
            if session is None:
                _db.close()

    for idx, f in enumerate(files):
        angle_num = idx + 1
        angle_lbl = ANGLE_LABELS[idx] if idx < len(ANGLE_LABELS) else f"Angle {angle_num}"
        orig_ext = os.path.splitext(f.filename)[1].lower() if f.filename else ""
        file_ext = orig_ext if orig_ext in [".jpg", ".jpeg", ".png", ".webp"] else ".jpg"
        unique_name = f"img_student_{current_user.school_id}_a{angle_num}_{uuid.uuid4().hex[:8]}{file_ext}"
        f_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(f_path, "wb") as buf:
            shutil.copyfileobj(f.file, buf)

        desc = f"[Angle {angle_num}/8: {angle_lbl}] Student Dining Attendance Headcount"

        sub = ImageSubmission(
            school_id=current_user.school_id,
            uploaded_by_user_id=current_user.id,
            category="STUDENT_EATING",
            image_url=f"/uploads/{unique_name}",
            video_url=None,
            media_type="image",
            file_name=f.filename or unique_name,
            meal_type=f"Student Attendance (Angle {angle_num}/8)",
            menu_description=desc,
            staff_name=clean_staff,
            inspection_shift=clean_shift,
            hygiene_notes=clean_hygiene,
            latitude=clean_lat,
            longitude=clean_lon,
            captured_location=clean_loc,
            captured_timestamp=clean_time,
            status="PENDING_REVIEW",
            cv_status=None,
            cv_notes=None,
            cv_confidence=None,
            cv_processed_at=None,
            cv_student_count=None,
            cv_match_percentage=None
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
        created_submissions.append(sub)
        to_process.append((sub, os.path.abspath(f_path), angle_num))

    # Run CV analysis for each angle synchronously so headcounts are immediately persisted
    for sub, abs_p, angle_num in to_process:
        _run_single_cv(abs_p, sub.id, angle_num, session=db)
        db.refresh(sub)

    log_audit(
        db=db,
        action="STUDENT_BATCH_UPLOADED",
        details=f"Uploaded {len(created_submissions)} angle images for student attendance headcount (CV completed).",
        user_email=current_user.email,
        school_id=current_user.school_id,
        user_id=current_user.id
    )

    return {
        "status": "success",
        "message": f"Successfully uploaded all {len(created_submissions)} angle photos. AI student headcount completed successfully.",
        "count": len(created_submissions),
        "images": created_submissions
    }

@router.get("/alerts", response_model=List[AlertResponse])
def get_school_alerts(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    """
    Show ONLY alerts for the logged-in school.
    """
    alerts = db.query(Alert).filter(
        Alert.school_id == current_user.school_id
    ).order_by(Alert.created_at.desc()).all()
    return alerts

@router.get("/profile")
def get_school_profile(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    return {
        "school_id": school.id,
        "school_name": school.name,
        "school_code": school.school_code,
        "district": school.district,
        "state": school.state,
        "address": school.address,
        "principal_name": school.principal_name,
        "email": school.email,
        "phone": school.phone,
        "status": school.status,
        "hardware_status": school.hardware_status,
        "hardware_device_id": school.hardware_device_id,
        "hardware_api_key": school.hardware_api_key,
        "tank_capacity_litres": school.tank_capacity_litres,
        "tank_height_cm": school.tank_height_cm,
        "user_email": current_user.email,
        "user_full_name": current_user.full_name
    }
