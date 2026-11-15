import React, { useState, useRef, useEffect } from 'react';
import {
  X, Camera, Check, AlertCircle, RefreshCw, MapPin, Clock,
  ShieldCheck, SwitchCamera, VideoOff, Users, UtensilsCrossed,
  Calendar, Layers, CheckCircle2, ChevronRight, UploadCloud,
  FileImage, FolderPlus, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { schoolService } from '../services/api';
import { AP_MDM_ZONES, DAYS_OF_WEEK, getTodayDayName } from '../data/mdmMenu';

const EIGHT_ANGLES = [
  { id: 1, label: 'Front Center', desc: 'Main dining hall center rows' },
  { id: 2, label: 'Front Left', desc: 'Front left dining tables & benches' },
  { id: 3, label: 'Front Right', desc: 'Front right dining tables & benches' },
  { id: 4, label: 'Left Corridor', desc: 'Left dining corridor & side seating' },
  { id: 5, label: 'Right Corridor', desc: 'Right dining corridor & side seating' },
  { id: 6, label: 'Rear Dining', desc: 'Back of dining hall looking forward' },
  { id: 7, label: 'Center Aisle', desc: 'Middle walking lane & food line' },
  { id: 8, label: 'Wide View', desc: 'Full hall wide panoramic perspective' }
];

export const StaffUploadModal = ({ isOpen, onClose, onUploadSuccess, schoolName }) => {
  const [category, setCategory] = useState('MEAL_PREPARATION');
  const [captureMethod, setCaptureMethod] = useState('file'); // 'file' or 'camera' (default to file for maximum device compatibility)
  
  // AP MDM Zone & Day State for Food Inspection
  const [selectedZone, setSelectedZone] = useState(2); // Default to Zone 2 (Krishna District / Penamaluru)
  const [selectedDay, setSelectedDay] = useState(getTodayDayName());

  // 8 Angle State for Student Count
  const [selectedAngle, setSelectedAngle] = useState(1);
  const [capturedAnglePhotos, setCapturedAnglePhotos] = useState(new Array(8).fill(null));

  const [mealType, setMealType] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [staffName, setStaffName] = useState('Smt. Sudha Rani');
  const [inspectionShift, setInspectionShift] = useState('Lunch Serving');
  const [hygieneNotes, setHygieneNotes] = useState('');

  // File Input Refs
  const singleFileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);
  const angleFileInputRef = useRef(null);

  // Camera & Stream State
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) or 'user' (front)
  
  // Geolocation State
  const [locationData, setLocationData] = useState({
    latitude: 16.4674,
    longitude: 80.7098,
    accuracy: null,
    text: '16.4674° N, 80.7098° E (ZPHS Penamaluru Node)',
    isLoaded: true
  });

  // Single Captured Photo State (for Meal Prep & Hygiene)
  const [singleCapturedBlob, setSingleCapturedBlob] = useState(null);
  const [singlePreviewUrl, setSinglePreviewUrl] = useState(null);
  const [singleMeta, setSingleMeta] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Current Zone Menu Data
  const currentZoneData = AP_MDM_ZONES[selectedZone] || AP_MDM_ZONES[2];
  const currentDayMenu = currentZoneData.schedule[selectedDay] || currentZoneData.schedule['Monday'];

  // Fetch Geolocation when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const acc = Math.round(position.coords.accuracy);
          setLocationData({
            latitude: lat,
            longitude: lon,
            accuracy: acc,
            text: `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E (±${acc}m)`,
            isLoaded: true
          });
        },
        (error) => {
          console.warn("Geolocation warning:", error.message);
          setLocationData({
            latitude: 16.4674,
            longitude: 80.7098,
            accuracy: null,
            text: `16.4674° N, 80.7098° E (ZPHS Penamaluru Node)`,
            isLoaded: true
          });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  }, [isOpen]);

  // Start Camera Stream
  const startCamera = async (facing = facingMode) => {
    setCameraError('');
    stopCamera();

    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } catch (fallbackErr) {
        setCameraActive(false);
        setCameraError('Camera unavailable or permission denied. Switched to device photo upload.');
        setCaptureMethod('file');
      }
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Sync camera when modal opens in camera mode
  useEffect(() => {
    if (isOpen && captureMethod === 'camera') {
      if (category === 'STUDENT_EATING' || !singlePreviewUrl) {
        startCamera(facingMode);
      } else {
        stopCamera();
      }
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, captureMethod, category, singlePreviewUrl]);

  // Toggle Camera Front/Back
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // ─────────────────────────────────────────────────────────────
  // Canvas Watermark Generator (Location + Timestamp + AP Gov Seal)
  // ─────────────────────────────────────────────────────────────
  const stampImageAndCreateBlob = (imageSource, width, height, customAngle = null) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. Draw raw image
      ctx.drawImage(imageSource, 0, 0, width, height);

      // 2. Prepare timestamp and location strings
      const now = new Date();
      const timestampStr = now.toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'medium',
        hour12: true
      });
      const isoTimestamp = now.toISOString();

      const locString = locationData.text || 'Location: ZPHS Penamaluru Node';
      const nodeLabel = schoolName || 'ZPHS Penamaluru';
      
      const curAngleObj = customAngle || (EIGHT_ANGLES.find((a) => a.id === selectedAngle) || EIGHT_ANGLES[0]);
      const categoryLabel =
        category === 'MEAL_PREPARATION'
          ? `MEAL PREPARATION • ZONE ${selectedZone} (${selectedDay.toUpperCase()})`
          : category === 'KITCHEN_HYGIENE'
          ? 'KITCHEN HYGIENE INSPECTION'
          : `STUDENT ATTENDANCE [Angle ${curAngleObj.id}/8: ${curAngleObj.label}]`;

      const shiftLabel = inspectionShift || 'Lunch Serving';
      const staffLabel = staffName ? `Staff: ${staffName}` : 'Mid-Day Meal Staff';

      // 3. Burn Security Watermark Banner
      const bannerHeight = Math.max(90, Math.round(height * 0.16));
      const bannerY = height - bannerHeight;

      const gradient = ctx.createLinearGradient(0, bannerY, 0, height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.88)');
      gradient.addColorStop(1, 'rgba(2, 6, 23, 0.96)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, bannerY, width, bannerHeight);

      ctx.fillStyle = '#0d9488';
      ctx.fillRect(0, bannerY, width, 4);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      const baseFontSize = Math.max(12, Math.round(height * 0.024));
      ctx.font = `bold ${baseFontSize}px 'Inter', sans-serif`;

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`LOCATION: ${locString}  |  ${nodeLabel}`, 20, bannerY + baseFontSize + 12);

      ctx.fillStyle = '#facc15';
      ctx.fillText(`CAPTURE TIME: ${timestampStr}`, 20, bannerY + (baseFontSize * 2) + 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = `500 ${Math.max(11, baseFontSize - 2)}px 'Inter', sans-serif`;
      ctx.fillText(`${categoryLabel}  •  ${shiftLabel}  •  ${staffLabel}`, 20, bannerY + (baseFontSize * 3) + 24);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#2dd4bf';
      ctx.font = `bold ${Math.max(11, baseFontSize - 2)}px 'Inter', sans-serif`;
      ctx.fillText('GOVT OF ANDHRA PRADESH', width - 20, bannerY + baseFontSize + 12);
      ctx.fillStyle = '#94a3b8';
      ctx.font = `400 ${Math.max(10, baseFontSize - 4)}px 'Inter', sans-serif`;
      ctx.fillText(
        category === 'STUDENT_EATING'
          ? `YOLOv8 Student Headcount • Angle ${curAngleObj.id} of 8`
          : `AP MDM 2025 Verified • Zone ${selectedZone}`,
        width - 20,
        bannerY + (baseFontSize * 2) + 18
      );

      ctx.textAlign = 'left';
      ctx.shadowColor = 'transparent';

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(null); return; }
          const url = URL.createObjectURL(blob);
          const meta = {
            timestamp: isoTimestamp,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            location_text: locString
          };
          resolve({ blob, url, meta });
        },
        'image/jpeg',
        0.92
      );
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Photo Capture from Live Video
  // ─────────────────────────────────────────────────────────────
  const captureFromVideo = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const result = await stampImageAndCreateBlob(video, width, height);
    if (!result) return;

    if (category === 'STUDENT_EATING') {
      const curAngleObj = EIGHT_ANGLES.find((a) => a.id === selectedAngle) || EIGHT_ANGLES[0];
      setCapturedAnglePhotos((prev) => {
        const updated = [...prev];
        if (updated[selectedAngle - 1]?.previewUrl) {
          URL.revokeObjectURL(updated[selectedAngle - 1].previewUrl);
        }
        updated[selectedAngle - 1] = {
          blob: result.blob,
          previewUrl: result.url,
          meta: result.meta,
          angleId: curAngleObj.id,
          angleLabel: curAngleObj.label
        };
        return updated;
      });

      // Auto-advance angle
      setCapturedAnglePhotos((currentArr) => {
        const nextEmptyIndex = currentArr.findIndex((slot, i) => i !== (selectedAngle - 1) && !slot);
        if (nextEmptyIndex !== -1) {
          setSelectedAngle(nextEmptyIndex + 1);
        } else if (selectedAngle < 8) {
          setSelectedAngle(selectedAngle + 1);
        }
        return currentArr;
      });
    } else {
      setSingleCapturedBlob(result.blob);
      setSinglePreviewUrl(result.url);
      setSingleMeta(result.meta);
      stopCamera();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Photo Upload from Local File (Single Mode)
  // ─────────────────────────────────────────────────────────────
  const handleSingleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const width = img.naturalWidth || 1280;
        const height = img.naturalHeight || 720;
        const result = await stampImageAndCreateBlob(img, width, height);
        if (result) {
          setSingleCapturedBlob(result.blob);
          setSinglePreviewUrl(result.url);
          setSingleMeta(result.meta);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    // Reset file input so re-selecting same file fires onChange
    e.target.value = '';
  };

  // ─────────────────────────────────────────────────────────────
  // Photo Upload for Specific Angle Slot
  // ─────────────────────────────────────────────────────────────
  const handleSlotFileUpload = (e, angleIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const angleObj = EIGHT_ANGLES[angleIdx];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const width = img.naturalWidth || 1280;
        const height = img.naturalHeight || 720;
        const result = await stampImageAndCreateBlob(img, width, height, angleObj);
        if (result) {
          setCapturedAnglePhotos((prev) => {
            const updated = [...prev];
            if (updated[angleIdx]?.previewUrl) {
              URL.revokeObjectURL(updated[angleIdx].previewUrl);
            }
            updated[angleIdx] = {
              blob: result.blob,
              previewUrl: result.url,
              meta: result.meta,
              angleId: angleObj.id,
              angleLabel: angleObj.label
            };
            return updated;
          });
          // Auto select next empty angle
          if (angleIdx + 1 < 8) setSelectedAngle(angleIdx + 2);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ─────────────────────────────────────────────────────────────
  // Batch Upload All 8 Angles from Multiple Files
  // ─────────────────────────────────────────────────────────────
  const handleBatchFilesUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file, idx) => {
      if (idx >= 8) return;
      const angleObj = EIGHT_ANGLES[idx];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const width = img.naturalWidth || 1280;
          const height = img.naturalHeight || 720;
          const result = await stampImageAndCreateBlob(img, width, height, angleObj);
          if (result) {
            setCapturedAnglePhotos((prev) => {
              const updated = [...prev];
              if (updated[idx]?.previewUrl) {
                URL.revokeObjectURL(updated[idx].previewUrl);
              }
              updated[idx] = {
                blob: result.blob,
                previewUrl: result.url,
                meta: result.meta,
                angleId: angleObj.id,
                angleLabel: angleObj.label
              };
              return updated;
            });
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Retake photo for single mode
  const handleSingleRetake = () => {
    if (singlePreviewUrl) {
      URL.revokeObjectURL(singlePreviewUrl);
    }
    setSinglePreviewUrl(null);
    setSingleCapturedBlob(null);
    setSingleMeta(null);
    if (captureMethod === 'camera') {
      startCamera(facingMode);
    }
  };

  // Clear specific angle in multi-angle mode
  const handleRetakeAngle = (idx) => {
    setCapturedAnglePhotos((prev) => {
      const updated = [...prev];
      if (updated[idx]?.previewUrl) {
        URL.revokeObjectURL(updated[idx].previewUrl);
      }
      updated[idx] = null;
      return updated;
    });
    setSelectedAngle(idx + 1);
  };

  // Close and cleanup
  const handleCloseModal = () => {
    stopCamera();
    if (singlePreviewUrl) URL.revokeObjectURL(singlePreviewUrl);
    capturedAnglePhotos.forEach((item) => {
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setSinglePreviewUrl(null);
    setSingleCapturedBlob(null);
    setSingleMeta(null);
    setCapturedAnglePhotos(new Array(8).fill(null));
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
  };

  // Count captured angles
  const capturedAnglesCount = capturedAnglePhotos.filter(Boolean).length;
  const isEightAnglesReady = capturedAnglesCount === 8;

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (category === 'STUDENT_EATING') {
      if (!isEightAnglesReady) {
        setErrorMsg(`All 8 angle images must be uploaded/captured before submission. Currently uploaded: ${capturedAnglesCount} / 8.`);
        return;
      }
    } else {
      if (!singleCapturedBlob) {
        setErrorMsg('Please select or capture an image before submitting.');
        return;
      }
    }

    if (!staffName.trim()) {
      setErrorMsg('Please enter the Cook / Staff name responsible for this inspection.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const nowIso = new Date().toISOString();
      const locText = singleMeta?.location_text || locationData.text || 'Geo-Stamp Verified';
      const lat = singleMeta?.latitude ?? locationData.latitude;
      const lon = singleMeta?.longitude ?? locationData.longitude;

      if (category === 'STUDENT_EATING') {
        const formData = new FormData();
        capturedAnglePhotos.forEach((item, index) => {
          if (item?.blob) {
            formData.append('files', item.blob, `student_angle_${index + 1}_${Date.now()}.jpg`);
          }
        });

        formData.append('staff_name', staffName.trim());
        formData.append('inspection_shift', inspectionShift);
        formData.append('hygiene_notes', hygieneNotes);
        formData.append('timestamp', nowIso);
        formData.append('captured_timestamp', nowIso);
        if (lat !== null && lat !== undefined) formData.append('latitude', lat.toString());
        if (lon !== null && lon !== undefined) formData.append('longitude', lon.toString());
        formData.append('captured_location', locText);
        formData.append('location_text', locText);

        await schoolService.uploadStudentBatch(formData);
        setSuccessMsg('All 8 angle photos submitted & verified! YOLOv8 student headcount updated.');

      } else {
        const formData = new FormData();
        formData.append('file', singleCapturedBlob, `meal_${Date.now()}.jpg`);
        formData.append('category', category);

        if (category === 'MEAL_PREPARATION') {
          formData.append('zone', selectedZone.toString());
          formData.append('day_of_week', selectedDay);
          formData.append('meal_type', `Zone ${selectedZone} - ${selectedDay} Menu`);
          const officialDesc = `[Zone ${selectedZone}: ${selectedDay}] ${currentDayMenu.title} (${currentDayMenu.items.join(', ')})`;
          formData.append('menu_description', menuDescription.trim() ? `${officialDesc} • Note: ${menuDescription.trim()}` : officialDesc);
        } else {
          formData.append('meal_type', 'Kitchen Cleanliness & Hygiene');
          formData.append('menu_description', menuDescription || 'Sanitation and hygiene verification');
        }

        formData.append('staff_name', staffName.trim());
        formData.append('inspection_shift', inspectionShift);
        formData.append('hygiene_notes', hygieneNotes);
        formData.append('timestamp', nowIso);
        formData.append('captured_timestamp', nowIso);
        if (lat !== null && lat !== undefined) formData.append('latitude', lat.toString());
        if (lon !== null && lon !== undefined) formData.append('longitude', lon.toString());
        formData.append('captured_location', locText);
        formData.append('location_text', locText);

        await schoolService.uploadMealImage(formData);
        setSuccessMsg(
          category === 'MEAL_PREPARATION'
            ? `Photo stamped & submitted! Automated match verification against Zone ${selectedZone} (${selectedDay}) menu in progress.`
            : 'Kitchen hygiene photo stamped & submitted for inspection review.'
        );
      }

      if (onUploadSuccess) onUploadSuccess();

      setTimeout(() => {
        handleCloseModal();
      }, 1200);
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit inspection capture. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentAngleObj = EIGHT_ANGLES.find((a) => a.id === selectedAngle) || EIGHT_ANGLES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                School Field Node • Photo Inspection & Attendance
              </h2>
              <p className="text-xs text-slate-500">
                Statutory Mid-Day Meal Menu & 8-Angle Student Attendance Headcount
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submission Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Inspection Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('MEAL_PREPARATION')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                  category === 'MEAL_PREPARATION'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Meal Prep (Zone Menu)
              </button>
              <button
                type="button"
                onClick={() => setCategory('KITCHEN_HYGIENE')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                  category === 'KITCHEN_HYGIENE'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Kitchen Hygiene
              </button>
              <button
                type="button"
                onClick={() => setCategory('STUDENT_EATING')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                  category === 'STUDENT_EATING'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Students Eating (8 Angles)
              </button>
            </div>

            {/* MEAL PREPARATION - Zone Selector & 2025 Menu Card */}
            {category === 'MEAL_PREPARATION' && (
              <div className="mt-2.5 p-3 rounded-lg bg-teal-50/70 border border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-teal-900 flex items-center space-x-1.5">
                    <UtensilsCrossed className="w-4 h-4 text-teal-700" />
                    <span>Select School MDM Zone (2025 Revised):</span>
                  </span>

                  {/* Day Picker */}
                  <div className="flex items-center space-x-1 bg-white border border-teal-200 rounded-md px-2 py-0.5">
                    <Calendar className="w-3 h-3 text-teal-600" />
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-teal-900 focus:outline-none cursor-pointer"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d} {d === getTodayDayName() ? '(Today)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4 Zone Selector Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((zId) => {
                    const zData = AP_MDM_ZONES[zId];
                    const isSelected = selectedZone === zId;
                    return (
                      <button
                        key={zId}
                        type="button"
                        onClick={() => setSelectedZone(zId)}
                        className={`p-1.5 rounded-lg text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-400'
                            : 'bg-white text-slate-700 border border-teal-200 hover:bg-teal-100'
                        }`}
                      >
                        <div className="text-[11px] font-bold">{zData.name}</div>
                        <div className={`text-[9px] truncate ${isSelected ? 'text-teal-200' : 'text-slate-500'}`}>
                          {zData.districts}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Statutory Menu Verified Display */}
                <div className="p-2.5 rounded-lg bg-white border border-teal-200 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-950 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>{currentZoneData.name} • {selectedDay} Mandatory Diet</span>
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                      AI % Match Target
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-900">
                    {currentDayMenu.title}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {currentDayMenu.items.map((it, i) => (
                      <span key={i} className="text-[10px] font-medium bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded">
                        ✓ {it}
                      </span>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-500 pt-0.5">
                    {currentDayMenu.description}
                  </p>
                </div>
              </div>
            )}

            {/* STUDENT COUNT - 8 Angle Requirement & Slots Gallery */}
            {category === 'STUDENT_EATING' && (
              <div className="mt-2.5 p-3 rounded-lg bg-teal-50 border border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-teal-900">
                    <Users className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Upload min 8 images from 8 different angles</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Batch Select 8 Photos from Device */}
                    <button
                      type="button"
                      onClick={() => batchFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold flex items-center space-x-1 shadow-2xs cursor-pointer transition-colors"
                      title="Select multiple images from device to fill the 8 angles"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Select 8 Photos from Device</span>
                    </button>
                    <input
                      ref={batchFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleBatchFilesUpload}
                    />

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isEightAnglesReady
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}>
                      {capturedAnglesCount} of 8 Uploaded
                    </span>
                  </div>
                </div>
                
                <p className="text-[11px] text-teal-800 leading-snug">
                  Photograph or select dining hall photos from all 8 designated angles. Click any card below to pick a photo for that angle, or use the batch button above:
                </p>

                {/* 8 Angle Selector Pills */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-1">
                  {EIGHT_ANGLES.map((ang, idx) => {
                    const isCaptured = Boolean(capturedAnglePhotos[idx]);
                    const isCurrent = selectedAngle === ang.id;
                    return (
                      <button
                        key={ang.id}
                        type="button"
                        onClick={() => setSelectedAngle(ang.id)}
                        className={`p-1.5 rounded-md text-center transition-all cursor-pointer relative ${
                          isCurrent
                            ? 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-400 font-bold'
                            : isCaptured
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold'
                            : 'bg-white text-slate-700 border border-teal-200 hover:bg-teal-100 font-medium'
                        }`}
                        title={`${ang.label} — ${ang.desc}`}
                      >
                        {isCaptured && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                            ✓
                          </span>
                        )}
                        <div className="text-[10px]">#{ang.id}</div>
                        <div className="text-[8px] truncate">{ang.label}</div>
                      </button>
                    );
                  })}
                </div>

                {/* 8 Angle Captured Thumbnails Preview Strip */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-teal-900">
                      8-Angle Gallery ({capturedAnglesCount}/8 ready):
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {EIGHT_ANGLES.map((ang, idx) => {
                      const photoObj = capturedAnglePhotos[idx];
                      return (
                        <div
                          key={ang.id}
                          className={`relative rounded-md border h-18 flex flex-col items-center justify-center overflow-hidden transition-all ${
                            photoObj
                              ? 'border-emerald-500 bg-black shadow-xs'
                              : selectedAngle === ang.id
                              ? 'border-dashed border-teal-500 bg-white ring-2 ring-teal-400'
                              : 'border-dashed border-slate-300 bg-slate-50'
                          }`}
                        >
                          {photoObj ? (
                            <>
                              <img
                                src={photoObj.previewUrl}
                                alt={`Angle ${ang.id}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-0.5 flex items-center justify-between text-[8px] text-white">
                                <span className="font-bold pl-0.5">#{ang.id}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRetakeAngle(idx)}
                                  className="text-rose-300 hover:text-white px-1 font-bold"
                                  title="Remove/replace this angle"
                                >
                                  ✕
                                </button>
                              </div>
                            </>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center p-1 text-center cursor-pointer hover:bg-teal-50">
                              <Camera className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                              <span className="text-[8px] text-slate-600 font-bold truncate max-w-full">
                                #{ang.id} {ang.label.split(' ')[0]}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleSlotFileUpload(e, idx)}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[10px] text-teal-900 bg-white/90 border border-teal-200 rounded px-2.5 py-1.5 flex items-center justify-between">
                  <span><strong>Current Target:</strong> Angle {currentAngleObj.id} ({currentAngleObj.label}) — {currentAngleObj.desc}</span>
                  <span className="text-teal-700 font-mono font-bold">Angle {currentAngleObj.id}/8</span>
                </div>
              </div>
            )}

            {category === 'KITCHEN_HYGIENE' && (
              <p className="mt-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                Kitchen sanitation photo will be verified and graded by the Mandal Educational Officer (MEO).
              </p>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* Method Switcher: File Upload vs Live Camera */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setCaptureMethod('file'); stopCamera(); }}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer ${
                    captureMethod === 'file'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload from Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setCaptureMethod('camera'); startCamera(facingMode); }}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer ${
                    captureMethod === 'camera'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Live Camera Capture</span>
                </button>
              </div>

              {/* GPS indicator pill */}
              <div className="flex items-center space-x-1 text-[11px] text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                <span className="font-mono truncate max-w-[200px]">{locationData.text}</span>
              </div>
            </div>

            {/* Viewfinder / File Upload Box */}
            <div className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-xl border border-slate-300 overflow-hidden flex flex-col items-center justify-center">
              
              {/* Single photo preview (for Meal Prep / Hygiene) */}
              {category !== 'STUDENT_EATING' && singlePreviewUrl ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <img
                    src={singlePreviewUrl}
                    alt="Captured Stamped Preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold shadow-xs flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Photo Stamped & Ready</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSingleRetake}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-md bg-white/95 hover:bg-white text-slate-800 text-xs font-semibold border border-slate-200 shadow-xs flex items-center space-x-1 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    <span>Change Photo</span>
                  </button>
                </div>
              ) : captureMethod === 'file' ? (
                /* FILE UPLOAD DROPZONE */
                <div className="w-full h-full bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-teal-900/60 border border-teal-500/40 flex items-center justify-center text-teal-400">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {category === 'STUDENT_EATING'
                        ? `Upload photo for [Angle ${currentAngleObj.id}: ${currentAngleObj.label}]`
                        : `Select ${category === 'MEAL_PREPARATION' ? 'Meal' : 'Hygiene'} Photo from Device`}
                    </p>
                    <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                      Supports JPG, PNG, WEBP. The official AP Govt geo-tag, timestamp, and menu verification watermark will be stamped automatically.
                    </p>
                  </div>

                  {category === 'STUDENT_EATING' ? (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <label className="px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer">
                        <Camera className="w-4 h-4" />
                        <span>Choose Photo for Angle #{currentAngleObj.id}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleSlotFileUpload(e, selectedAngle - 1)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => batchFileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-teal-500/30 text-teal-200 text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>Select All 8 Photos at Once</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <label className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer">
                        <FileImage className="w-4 h-4" />
                        <span>Browse / Select Inspection Photo</span>
                        <input
                          ref={singleFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleSingleFileUpload}
                        />
                      </label>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono">
                    Node: {schoolName || 'ZPHS Penamaluru'} • GPS Auto-Burn Enabled
                  </div>
                </div>
              ) : cameraActive ? (
                /* LIVE CAMERA VIEW */
                <div className="relative w-full h-full bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Top Bar HUD */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center space-x-2 pointer-events-auto">
                      <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-white font-mono flex items-center space-x-1.5 border border-white/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>LIVE CAMERA</span>
                      </div>

                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-colors shadow-xs"
                        title="Switch Front/Rear Camera"
                      >
                        <SwitchCamera className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>

                    {category === 'STUDENT_EATING' ? (
                      <div className="px-2.5 py-1 rounded-md bg-teal-900/90 text-teal-200 border border-teal-500/50 text-[10px] font-bold flex items-center space-x-1.5 shadow-xs pointer-events-auto">
                        <Users className="w-3.5 h-3.5 text-teal-300" />
                        <span>Angle {currentAngleObj.id}/8: {currentAngleObj.label}</span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 rounded-md bg-teal-900/90 text-teal-200 border border-teal-500/50 text-[10px] font-bold shadow-xs pointer-events-auto">
                        AP MDM Zone {selectedZone} ({selectedDay})
                      </div>
                    )}
                  </div>

                  {/* Viewfinder Bottom Controls Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-900/85 backdrop-blur-xs p-3 text-left border-t border-slate-700 flex items-center justify-between">
                    <div className="text-[10px] text-slate-200 space-y-0.5 font-mono">
                      <p className="flex items-center text-teal-300">
                        <MapPin className="w-3 h-3 mr-1 shrink-0" />
                        <span className="truncate max-w-[200px]">GPS: {locationData.text}</span>
                      </p>
                      <p className="flex items-center text-amber-300">
                        <Clock className="w-3 h-3 mr-1 shrink-0" />
                        <span>Auto-stamps date, time, location & menu</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={captureFromVideo}
                      className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>
                        {category === 'STUDENT_EATING'
                          ? `Take Angle #${currentAngleObj.id} Photo`
                          : 'Capture Photo'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Camera Inactive / Permission Error */
                <div className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                    <VideoOff className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {cameraError || 'Camera Access Not Active'}
                    </p>
                    <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                      You can use direct device photo upload instead to submit images instantly.
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setCaptureMethod('file')}
                      className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Use Device Photo Upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cook / Staff Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. S. Lakshmi Devi"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspection Shift
              </label>
              <select
                value={inspectionShift}
                onChange={(e) => setInspectionShift(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 cursor-pointer"
              >
                <option value="Morning Prep">Morning Prep (8:00 AM - 11:00 AM)</option>
                <option value="Lunch Serving">Lunch Serving (12:00 PM - 2:00 PM)</option>
                <option value="Sanitation Review">Sanitation & Kitchen Cleaning</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hygiene & Cleanliness Observation Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cooking pots sanitized, staff wearing aprons and hairnets, filtered water used."
              value={hygieneNotes}
              onChange={(e) => setHygieneNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 placeholder-slate-400 resize-none"
            />
          </div>

          {/* Action Buttons & Strict Submit Visibility Gate */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              {category === 'STUDENT_EATING' ? (
                isEightAnglesReady
                  ? 'All 8 angle images ready ✓'
                  : `Upload ${capturedAnglesCount} / 8 angles to unlock submit`
              ) : (
                singleCapturedBlob ? 'Photo ready & stamped ✓' : 'Photo required'
              )}
            </span>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              {/* STRICT REQUIREMENT: Submit button ONLY appears when all 8 images are uploaded for Student Eating! */}
              {category === 'STUDENT_EATING' ? (
                isEightAnglesReady ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-40 transition-colors flex items-center space-x-1.5 cursor-pointer animate-pulse"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading 8 Angles...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Submit All 8 Angle Images</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold flex items-center space-x-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Submit locked ({capturedAnglesCount}/8 ready)</span>
                  </div>
                )
              ) : (
                singleCapturedBlob && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs disabled:opacity-40 transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Submit Verified Photo</span>
                      </>
                    )}
                  </button>
                )
              )}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
