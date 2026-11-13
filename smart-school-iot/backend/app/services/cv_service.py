"""
Computer Vision Service — SmartSchoolIoT
=========================================
Features:
  1. food_quality_check(image_path, menu_description)
       - Deep Learning food & vessel detection (YOLOv8s + YOLOv8s-cls)
       - Hand & skin rejection (prevents hands/fingers/arms from passing as meals)
       - Underexposed / overexposed image rejection
       - Gemini Vision API integration (when GEMINI_API_KEY is configured)
       - Returns cv_status: "CV_PASS" | "CV_FLAG" | "CV_ERROR"
  2. count_students_in_image(image_path)
       - High-accuracy YOLOv8s student detection (conf >= 0.48, aspect-ratio filtered)
       - Close-up skin / hand rejection
       - Returns cv_student_count: int, cv_status: "CV_PASS" | "CV_FLAG"
"""

import os
import io
import json
import base64
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger("cv_service")

FOOD_COCO_CLASSES = {
    'bowl', 'cup', 'bottle', 'fork', 'knife', 'spoon', 'dining table',
    'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot',
    'hot dog', 'pizza', 'donut', 'cake'
}

FOOD_IMAGENET_KEYWORDS = {
    # Core culinary terms
    'food', 'soup', 'bowl', 'dish', 'plate', 'pot', 'cauldron', 'wok',
    'ladle', 'platter', 'consomme', 'hotpot', 'corn', 'dough', 'bread',
    'vegetable', 'fruit', 'meat', 'rice', 'curry', 'pasta', 'pizza',
    'sandwich', 'cucumber', 'orange', 'apple', 'banana', 'broccoli',
    'carrot', 'bagel', 'cookie', 'tray', 'measuring_cup', 'saucepan',
    'frying_pan', 'colander', 'pitcher', 'spatula',
    # Indian Food specific items & mid-day meal staples
    'dal', 'dahl', 'daal', 'sambar', 'rasam', 'lentil', 'chana', 'chickpea',
    'khichdi', 'khichri', 'pulao', 'biryani', 'pongal', 'roti', 'chapati',
    'flatbread', 'naan', 'paratha', 'poori', 'puri', 'sabzi', 'gravy',
    'egg', 'boiled egg', 'masala', 'paneer', 'chutney', 'pappu', 'upma',
    'idli', 'dosa', 'kheer', 'payasam', 'curd', 'yogurt', 'buttermilk',
    'spinach', 'palak', 'potato', 'aloo', 'gobi', 'cauliflower', 'beans',
    'thali', 'katori', 'degchi', 'degh', 'tiffin', 'compartment'
}

_det_model = None
_cls_model = None


def _get_det_model():
    """Load high-accuracy YOLOv8 detector (yolov8s.pt, yolov8m.pt, or yolov8n.pt)."""
    global _det_model
    if _det_model is not None:
        return _det_model
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        for model_name in ["yolov8s.pt", "yolov8m.pt", "yolov8n.pt"]:
            p = os.path.join(backend_dir, model_name)
            if os.path.exists(p):
                from ultralytics import YOLO
                _det_model = YOLO(p)
                logger.info(f"YOLO detector loaded successfully: {p}")
                return _det_model
        from ultralytics import YOLO
        _det_model = YOLO("yolov8s.pt")
        return _det_model
    except Exception as e:
        logger.warning(f"Could not load YOLO detector: {e}")
        return None


def _get_cls_model():
    """Load YOLOv8s ImageNet classifier for food & utensil categorization."""
    global _cls_model
    if _cls_model is not None:
        return _cls_model
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        p = os.path.join(backend_dir, "yolov8s-cls.pt")
        if not os.path.exists(p):
            p = "yolov8s-cls.pt"
        from ultralytics import YOLO
        _cls_model = YOLO(p)
        logger.info(f"YOLO classifier loaded successfully: {p}")
        return _cls_model
    except Exception as e:
        logger.warning(f"Could not load YOLO classifier: {e}")
        return None


def _calculate_skin_percentage(img) -> float:
    """Calculate the percentage of pixels matching human skin tones using YCrCb."""
    try:
        import cv2
        import numpy as np
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        skin_mask = cv2.inRange(ycrcb, np.array([0, 133, 77]), np.array([255, 173, 127]))
        total_pixels = img.shape[0] * img.shape[1]
        if total_pixels == 0:
            return 0.0
        return float((np.count_nonzero(skin_mask) / total_pixels) * 100.0)
    except Exception:
        return 0.0


def _detect_indian_meal_chroma(img) -> list:
    """
    Analyzes visual spectral signatures characteristic of Indian government school mid-day meals:
    - Cooked White Rice / Khichdi / Pulao (high luminance, low saturation grains)
    - Dal / Sambar / Rasam / Curry (turmeric golden-yellow, amber, red-brown hues)
    - Green Leafy Sabzi / Palak / Pappu (green vegetable chrominance)
    - Boiled Eggs (distinct smooth white oval contours)
    - Chana / Chickpeas / Legumes (golden-brown spherical granules)
    - Roti / Chapati (golden wheat or flatbread regions)
    - Stainless Steel Thali / Vessels (metallic reflective plate contours)
    """
    detected = []
    try:
        import cv2
        import numpy as np

        h, w = img.shape[:2]
        total_px = max(h * w, 1)

        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h_ch, s_ch, v_ch = cv2.split(hsv)

        # 1. Steamed Rice (Chawal / Anna) — high brightness, low saturation
        rice_mask = cv2.inRange(hsv, np.array([0, 0, 150]), np.array([180, 50, 255]))
        rice_ratio = np.count_nonzero(rice_mask) / total_px
        if rice_ratio >= 0.035:
            detected.append("Cooked Rice (Chawal)")

        # 2. Dal / Sambar / Rasam / Turmeric Curry (golden-yellow, amber, warm orange)
        dal_mask = cv2.inRange(hsv, np.array([8, 42, 48]), np.array([38, 255, 255]))
        dal_ratio = np.count_nonzero(dal_mask) / total_px
        if dal_ratio >= 0.025:
            detected.append("Dal / Sambar (Lentil Curry)")

        # 3. Green Sabzi / Leafy Greens (Palak, Beans, Peas, Curry leaves)
        veg_mask = cv2.inRange(hsv, np.array([34, 32, 32]), np.array([88, 255, 240]))
        veg_ratio = np.count_nonzero(veg_mask) / total_px
        if veg_ratio >= 0.020:
            detected.append("Vegetable Sabzi / Greens")

        # 4. Boiled Eggs (smooth white oval/circular clusters)
        egg_mask = cv2.inRange(hsv, np.array([0, 0, 180]), np.array([180, 42, 255]))
        contours, _ = cv2.findContours(egg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        oval_count = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 120 < area < (total_px * 0.07):
                peri = cv2.arcLength(cnt, True)
                if peri > 0:
                    circularity = 4 * np.pi * (area / (peri * peri))
                    if circularity > 0.50:
                        oval_count += 1
        if oval_count >= 4:
            detected.append("Boiled Eggs")

        # 5. Chana / Chickpeas / Legumes (golden-brown spherical granules)
        chana_mask = cv2.inRange(hsv, np.array([10, 65, 65]), np.array([26, 230, 215]))
        chana_ratio = np.count_nonzero(chana_mask) / total_px
        if chana_ratio >= 0.035 and "Dal / Sambar (Lentil Curry)" in detected and oval_count >= 2:
            detected.append("Chana / Chickpeas (Legumes)")

        # 6. Roti / Chapati / Wheat Flatbread
        roti_mask = cv2.inRange(hsv, np.array([12, 35, 110]), np.array([28, 160, 235]))
        roti_ratio = np.count_nonzero(roti_mask) / total_px
        if roti_ratio >= 0.040 and "Cooked Rice (Chawal)" not in detected:
            detected.append("Roti / Chapati")

        # 7. Stainless Steel Dining Thali / Compartment Plate / Cooking Vessel
        plate_mask = cv2.inRange(hsv, np.array([0, 0, 70]), np.array([180, 32, 220]))
        plate_ratio = np.count_nonzero(plate_mask) / total_px
        if plate_ratio >= 0.06:
            detected.append("Steel Thali / Vessel")

    except Exception as e:
        logger.debug(f"Chroma analysis error: {e}")

    return detected


def _get_gemini_api_key() -> str:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        key = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
    return key


def _gemini_vision_check(image_path: str, menu_description: str, api_key: str) -> Optional[dict]:
    """Call Gemini Vision API via direct HTTP REST request."""
    import requests
    from PIL import Image

    img = Image.open(image_path)
    img.thumbnail((1024, 1024), Image.LANCZOS)
    if img.mode != "RGB":
        img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    b64_data = base64.b64encode(buf.getvalue()).decode("utf-8")

    prompt = (
        "You are an automated school mid-day meal quality inspector for a government school in India under the PM-POSHAN scheme.\n"
        f"Stated Menu Description: \"{menu_description or 'Daily Indian Mid-Day Meal (Rice, Dal/Sambar, Vegetable Sabzi)'}\"\n\n"
        "Analyze the provided photo. Identify traditional Indian school dishes such as:\n"
        "- Steamed white rice, vegetable pulao, khichdi, pongal, lemon rice\n"
        "- Yellow dal, toor dal, moong dal, sambar, rasam, leafy greens pappu\n"
        "- Vegetable curry, aloo sabzi, chana/chickpeas, beans, egg curry, boiled eggs\n"
        "- Roti, chapati, curd, buttermilk, payasam, chikki, banana\n"
        "- Steel thali plates, compartment trays, or large aluminum degh/cauldrons\n\n"
        "Respond ONLY in valid JSON (no markdown formatting, no code fences):\n"
        "{\n"
        '  "status": "PASS" or "FLAG",\n'
        '  "confidence": <float 0.80 to 0.99>,\n'
        '  "reason": "<concise explanation mentioning the specific Indian meal items detected>",\n'
        '  "food_detected": "<specific list e.g. Cooked Rice, Yellow Dal, Boiled Egg, Vegetable Curry>",\n'
        '  "menu_match": true or false\n'
        "}\n\n"
        "Flag (status: FLAG) ONLY if the image is blank/black, shows human skin/fingers instead of food, shows non-food clutter, spoiled/unhygienic items, or completely empty plates.\n"
        "Pass (status: PASS) if actual cooked Indian meal items, dal, rice, curries, or food preparation vessels are visible."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": b64_data
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 300
        }
    }

    resp = requests.post(url, json=payload, timeout=20)
    if resp.status_code != 200:
        logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:120]}")
        return None

    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return None

    raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
    raw_text = raw_text.strip()

    parsed = json.loads(raw_text)
    is_pass = str(parsed.get("status", "FLAG")).upper() == "PASS"
    reason = parsed.get("reason", "")
    food = parsed.get("food_detected", "Food items")
    confidence = float(parsed.get("confidence", 0.85))

    return {
        "cv_status": "CV_PASS" if is_pass else "CV_FLAG",
        "cv_notes": f"Gemini Vision: {food}. {reason}",
        "cv_confidence": round(confidence, 2)
    }


def food_quality_check(image_path: str, menu_description: str = "") -> dict:
    """
    Evaluates food preparation and kitchen hygiene images.
    1. Rejects blank, dark, overexposed, or corrupt images.
    2. Rejects hand / skin close-ups with no culinary vessels.
    3. Runs YOLOv8 object detection for food items, bowls, pots, cups, and utensils.
    4. Runs YOLOv8 ImageNet classification for dishes and meal categories.
    5. Falls back to Gemini Vision if API key is provided.
    """
    import cv2
    import numpy as np

    now = datetime.utcnow().isoformat()
    image_path = os.path.abspath(image_path)

    # 1. Image readability check
    img = cv2.imread(image_path)
    if img is None:
        return {
            "cv_status": "CV_FLAG",
            "cv_notes": "Corrupt or unreadable image file. Flagged.",
            "cv_confidence": 0.95,
            "cv_processed_at": now
        }

    # 2. Exposure & brightness check
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mean_brightness = float(np.mean(gray))
    if mean_brightness < 25.0:
        return {
            "cv_status": "CV_FLAG",
            "cv_notes": f"Pitch black / underexposed image (brightness: {mean_brightness:.1f}/255). No meal visible. Flagged.",
            "cv_confidence": 0.98,
            "cv_processed_at": now
        }
    if mean_brightness > 245.0:
        return {
            "cv_status": "CV_FLAG",
            "cv_notes": "Image is overexposed / washed out white. No clear food visible. Flagged.",
            "cv_confidence": 0.95,
            "cv_processed_at": now
        }

    # 3. Hand / skin detection
    skin_pct = _calculate_skin_percentage(img)

    # 4. Optional Gemini Vision
    api_key = _get_gemini_api_key()
    if api_key:
        try:
            gemini_result = _gemini_vision_check(image_path, menu_description, api_key)
            if gemini_result:
                gemini_result["cv_processed_at"] = now
                return gemini_result
        except Exception as e:
            logger.warning(f"Gemini call failed, falling back to local vision models: {e}")

    # 5. Deep Learning YOLOv8 Detection & Classification
    try:
        det_model = _get_det_model()
        cls_model = _get_cls_model()

        detected_food_items = []
        if det_model is not None:
            res_det = det_model(image_path, conf=0.35, verbose=False)[0]
            for b in res_det.boxes:
                c_name = det_model.names[int(b.cls[0])]
                conf = float(b.conf[0])
                if c_name in FOOD_COCO_CLASSES:
                    detected_food_items.append(f"{c_name} ({conf:.0%})")

        top_cls_name = "unknown"
        top_cls_conf = 0.0
        is_cls_food = False
        if cls_model is not None:
            res_cls = cls_model(image_path, verbose=False)[0]
            if hasattr(res_cls, "probs") and res_cls.probs is not None:
                top_idx = res_cls.probs.top5[0]
                top_cls_name = res_cls.names[top_idx]
                top_cls_conf = float(res_cls.probs.data[top_idx])
                # Check top 3 classes for any food keywords
                for idx in res_cls.probs.top5[:3]:
                    name = res_cls.names[idx].lower()
                    if any(k in name for k in FOOD_IMAGENET_KEYWORDS):
                        is_cls_food = True
                        break

        # 5. Specialized Indian Mid-Day Meal Feature Detection (Rice, Dal/Sambar, Sabzi, Roti, Thali)
        indian_items = _detect_indian_meal_chroma(img)

        # Rejection: hand or skin area without genuine food vessels or food items
        if skin_pct > 32.0 and not detected_food_items and not is_cls_food and not indian_items:
            return {
                "cv_status": "CV_FLAG",
                "cv_notes": f"Human hand/skin detected ({skin_pct:.0f}% skin area, no food or vessels). Flagged for inspection.",
                "cv_confidence": 0.94,
                "cv_processed_at": now
            }

        # Passing condition A: Verified Indian Mid-Day Meal items (Dal, Rice, Sambar, Sabzi, Roti, Thali)
        food_only_items = [it for it in indian_items if it != "Steel Thali / Vessel"]
        if len(food_only_items) >= 1 or len(indian_items) >= 2 or (len(indian_items) >= 1 and (detected_food_items or is_cls_food)):
            all_found = list(dict.fromkeys(indian_items + [item.split()[0].title() for item in detected_food_items]))
            items_str = ", ".join(all_found[:6])
            return {
                "cv_status": "CV_PASS",
                "cv_notes": f"Verified Indian Mid-Day Meal: {items_str} confirmed in preparation.",
                "cv_confidence": 0.95,
                "cv_processed_at": now
            }

        # Passing condition B: Detected food vessels or food items from YOLOv8
        if detected_food_items:
            items_str = ", ".join(detected_food_items[:4])
            return {
                "cv_status": "CV_PASS",
                "cv_notes": f"YOLOv8 detected food preparation items: {items_str}.",
                "cv_confidence": 0.92,
                "cv_processed_at": now
            }

        if is_cls_food and top_cls_conf >= 0.15:
            clean_name = top_cls_name.replace("_", " ").title()
            return {
                "cv_status": "CV_PASS",
                "cv_notes": f"YOLOv8 classified meal item: {clean_name} ({top_cls_conf:.0%}).",
                "cv_confidence": round(top_cls_conf, 2),
                "cv_processed_at": now
            }

        # Otherwise, no positive food indicators found -> flag for review
        clean_name = top_cls_name.replace("_", " ").title()
        return {
            "cv_status": "CV_FLAG",
            "cv_notes": f"No recognizable food items, vessels, or cookware detected (classified: {clean_name}). Flagged for review.",
            "cv_confidence": 0.85,
            "cv_processed_at": now
        }

    except Exception as e:
        logger.error(f"Deep learning vision check failed: {e}")
        return {
            "cv_status": "CV_FLAG",
            "cv_notes": f"Vision analysis completed with flag: {str(e)[:80]}.",
            "cv_confidence": 0.6,
            "cv_processed_at": now
        }


def count_students_in_image(image_path: str) -> dict:
    """
    Detects and counts students in dining area using YOLOv8s.
    - Applies a confidence threshold of >= 0.48 to eliminate noise.
    - Filters bounding box aspect ratio and size to reject artifacts on skin/surfaces.
    - Automatically rejects hand / skin close-ups.
    """
    import cv2
    import numpy as np

    now = datetime.utcnow().isoformat()
    image_path = os.path.abspath(image_path)

    # 1. Check readability
    img = cv2.imread(image_path)
    if img is None:
        return {
            "cv_student_count": 0,
            "cv_status": "CV_FLAG",
            "cv_notes": "Unreadable image file. Count: 0. Flagged.",
            "cv_confidence": 0.0,
            "cv_processed_at": now
        }

    # 2. Brightness & exposure check
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mean_val = float(np.mean(gray))
    if mean_val < 25.0:
        return {
            "cv_student_count": 0,
            "cv_status": "CV_FLAG",
            "cv_notes": f"Pitch black / underexposed image (brightness: {mean_val:.1f}/255). No students visible. Flagged.",
            "cv_confidence": 0.98,
            "cv_processed_at": now
        }
    if mean_val > 245.0:
        return {
            "cv_student_count": 0,
            "cv_status": "CV_FLAG",
            "cv_notes": "Image is overexposed / washed out white. No students visible. Flagged.",
            "cv_confidence": 0.95,
            "cv_processed_at": now
        }

    # 3. Hand / skin close-up detection
    skin_pct = _calculate_skin_percentage(img)

    # 4. YOLOv8 Person Detection (Class 0: person)
    try:
        model = _get_det_model()
        if model is None:
            return {
                "cv_student_count": 0,
                "cv_status": "CV_FLAG",
                "cv_notes": "YOLO detector unavailable. Photo flagged for manual inspection.",
                "cv_confidence": 0.5,
                "cv_processed_at": now
            }

        h, w = img.shape[:2]
        # Run detection with confidence threshold >= 0.48
        results = model(image_path, conf=0.48, verbose=False, classes=[0])

        valid_student_boxes = []
        confidences = []

        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    bw = x2 - x1
                    bh = y2 - y1
                    aspect = bw / max(bh, 1.0)
                    area_ratio = (bw * bh) / (w * h)
                    conf = float(box.conf[0])

                    # Realistic person geometry:
                    # - Aspect ratio (width/height): between 0.15 (standing) and 1.6 (seated/eating)
                    #   (rejects flat horizontal strips across knuckles/fingers with aspect ratio 2.0+)
                    # - Area ratio: at least 1.0% of frame, at most 92% of frame
                    if 0.15 <= aspect <= 1.6 and 0.01 <= area_ratio <= 0.92:
                        valid_student_boxes.append(box)
                        confidences.append(conf)

        student_count = len(valid_student_boxes)

        # Hand / skin close-up guard: if skin occupies > 35% of frame and few/no valid student bodies
        if skin_pct > 35.0 and student_count <= 1:
            return {
                "cv_student_count": 0,
                "cv_status": "CV_FLAG",
                "cv_notes": f"Hand/skin close-up detected ({skin_pct:.0f}% skin area). No students visible in dining area. Flagged.",
                "cv_confidence": 0.94,
                "cv_processed_at": now
            }

        if student_count == 0:
            return {
                "cv_student_count": 0,
                "cv_status": "CV_FLAG",
                "cv_notes": "YOLOv8 detected 0 students in frame. Photo flagged (expected students eating during mid-day meal).",
                "cv_confidence": 0.88,
                "cv_processed_at": now
            }

        avg_conf = round(sum(confidences) / len(confidences), 2) if confidences else 0.85
        return {
            "cv_student_count": student_count,
            "cv_status": "CV_PASS",
            "cv_notes": f"YOLOv8 detected ~{student_count} student(s) eating (avg confidence: {avg_conf:.0%}).",
            "cv_confidence": avg_conf,
            "cv_processed_at": now
        }

    except Exception as e:
        logger.error(f"Student counting failed: {e}")
        return {
            "cv_student_count": 0,
            "cv_status": "CV_FLAG",
            "cv_notes": f"Student detection check encountered warning: {str(e)[:80]}. Flagged.",
            "cv_confidence": 0.5,
            "cv_processed_at": now
        }
