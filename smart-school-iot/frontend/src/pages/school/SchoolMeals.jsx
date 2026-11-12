import React, { useEffect, useState } from 'react';
import { schoolService, getImageUrl, FALLBACK_IMAGE } from '../../services/api';
import { StaffUploadModal } from '../../components/StaffUploadModal';
import {
  UtensilsCrossed,
  Camera,
  Check,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Thermometer,
  Calendar
} from 'lucide-react';

export const SchoolMeals = () => {
  const [data, setData] = useState({ meals: [], images: [], latest_sensor: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Meal Form State
  const [mealForm, setMealForm] = useState({
    meal_type: '',
    menu_description: '',
    students_served: '',
    hygiene_notes: ''
  });
  const [isSubmittingMeal, setIsSubmittingMeal] = useState(false);
  const [mealSuccess, setMealSuccess] = useState('');

  const fetchMeals = async () => {
    try {
      const res = await schoolService.getMeals();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeals();
    const interval = setInterval(fetchMeals, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingMeal(true);
    setMealSuccess('');

    try {
      await schoolService.createMeal({
        meal_type: mealForm.meal_type,
        menu_description: mealForm.menu_description,
        students_served: mealForm.students_served ? parseInt(mealForm.students_served) : null,
        hygiene_notes: mealForm.hygiene_notes
      });
      setMealSuccess('Meal log submitted successfully.');
      setMealForm({
        meal_type: '',
        menu_description: '',
        students_served: '',
        hygiene_notes: ''
      });
      fetchMeals();
      setTimeout(() => setMealSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingMeal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  const { meals, images, latest_sensor } = data;
  const filteredImages = categoryFilter === 'ALL' ? images : images.filter((img) => img.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mid-Day Meal & Kitchen Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit daily meal preparation details and upload inspection photos for state review
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setRefreshing(true); fetchMeals(); }}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs"
            title="Refresh submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>+ Upload Inspection Photo</span>
          </button>
        </div>
      </div>

      {/* Grid: Meal Form & Kitchen Environmental Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Meal Submission Form */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <UtensilsCrossed className="w-5 h-5 text-teal-600" />
              <span>Log Daily Mid-Day Meal Menu</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">{new Date().toLocaleDateString()}</span>
          </div>

          {mealSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{mealSuccess}</span>
            </div>
          )}

          <form onSubmit={handleMealSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Today's Prepared Meal Menu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rice, Sambar, Boiled Egg, Chikki"
                  value={mealForm.meal_type}
                  onChange={(e) => setMealForm({ ...mealForm, meal_type: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Students Attended / Served
                </label>
                <input
                  type="number"
                  placeholder="e.g. 142"
                  value={mealForm.students_served}
                  onChange={(e) => setMealForm({ ...mealForm, students_served: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ingredients & Preparation Details
              </label>
              <textarea
                rows={2}
                placeholder="Mention ingredient quality, cooking oil, freshness of vegetables, drinking water utilized."
                value={mealForm.menu_description}
                onChange={(e) => setMealForm({ ...mealForm, menu_description: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kitchen Hygiene & Sanitization Notes
              </label>
              <input
                type="text"
                placeholder="Cooking pots sanitized, clean uniforms, storage lids closed."
                value={mealForm.hygiene_notes}
                onChange={(e) => setMealForm({ ...mealForm, hygiene_notes: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmittingMeal}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                {isSubmittingMeal ? 'Submitting...' : 'Save Daily Meal Log'}
              </button>
            </div>
          </form>
        </div>

        {/* Real Kitchen Environment Sensor Box */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Thermometer className="w-4 h-4 text-teal-600" />
                <span>Kitchen Telemetry</span>
              </h3>
              <span className={`w-2 h-2 rounded-full ${latest_sensor?.humidity_pct !== undefined ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">Kitchen Relative Humidity</span>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  {latest_sensor?.humidity_pct !== undefined ? `${latest_sensor.humidity_pct}%` : '--'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {latest_sensor?.humidity_pct !== undefined ? (
                    latest_sensor.humidity_pct > 75 ? (
                      <span className="text-amber-700 font-medium">High humidity: ensure kitchen ventilation</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Optimal kitchen range (40% - 70%)</span>
                    )
                  ) : (
                    'DHT Sensor Offline'
                  )}
                </p>
              </div>

              {latest_sensor?.temperature_c !== undefined && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Kitchen Temperature</span>
                  <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {latest_sensor.temperature_c}°C
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic leading-relaxed pt-2 border-t border-slate-100">
            Strictly driven by physical DHT sensor deployed in the school kitchen. Temperature is only displayed if physically reported by the hardware.
          </p>
        </div>
      </div>

      {/* Uploaded Photo Submissions & Status Tracking */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Camera className="w-5 h-5 text-teal-600" />
            <span>Uploaded Inspection Photos ({images.length})</span>
          </h2>

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 p-1 rounded-lg text-xs shadow-xs">
            {[
              { id: 'ALL', label: 'All Photos' },
              { id: 'MEAL_PREPARATION', label: 'Meal Prep' },
              { id: 'KITCHEN_HYGIENE', label: 'Kitchen Hygiene' },
              { id: 'STUDENT_EATING', label: 'Students Eating' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  categoryFilter === tab.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredImages.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500 italic">
            No Submissions Yet in this category. Use the upload button above to submit photos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredImages.map((img) => {
              const categoryLabel =
                img.category === 'MEAL_PREPARATION' ? 'Meal Prep' :
                img.category === 'STUDENT_EATING' ? 'Students Eating' :
                'Kitchen Hygiene';

              const isZeroStudents = img.category === 'STUDENT_EATING' && (img.cv_student_count === 0 || img.cv_student_count === '0');
              const effectiveStatus = (isZeroStudents && img.status === 'CV_PASS') ? 'CV_FLAG' : img.status;

              const statusColor =
                effectiveStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                effectiveStatus === 'CV_PASS'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                effectiveStatus === 'FLAGGED'  ? 'bg-amber-50 text-amber-800 border-amber-200' :
                effectiveStatus === 'CV_FLAG'  ? 'bg-rose-50 text-rose-700 border-rose-200' :
                effectiveStatus === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <div key={img.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <div className="relative h-44 bg-slate-100">
                      <img
                        src={getImageUrl(img.image_url)}
                        alt="Meal Inspection"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Category Badge */}
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 text-slate-800 border border-slate-200 shadow-xs">
                        {categoryLabel}
                      </span>

                      {/* Status Pill */}
                      <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                        {effectiveStatus}
                      </span>

                      {/* Student Count Badge for Students Eating */}
                      {img.category === 'STUDENT_EATING' && (
                        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-900/90 text-white shadow-xs">
                          {img.cv_student_count != null
                            ? `${img.cv_student_count} students`
                            : (img.status === 'PENDING_REVIEW' ? 'Counting students…' : '0 students')}
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-1.5 text-xs">
                      <p className="font-bold text-slate-900 text-sm">{img.meal_type || 'Photo Inspection'}</p>
                      <p className="text-slate-500 text-[11px]">Staff: {img.staff_name || 'Staff'} • {img.inspection_shift}</p>

                      {/* CV result display */}
                      {img.cv_notes && (
                        <div className={`mt-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] ${
                          (img.cv_status === 'CV_PASS' && !isZeroStudents) ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                          (img.cv_status === 'CV_FLAG' || isZeroStudents) ? 'bg-rose-50 border-rose-200 text-rose-800' :
                          'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          <span className="font-semibold">Analysis: </span>{img.cv_notes}
                        </div>
                      )}

                      {img.hygiene_notes && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-200">
                          "{img.hygiene_notes}"
                        </p>
                      )}
                      {img.admin_notes && (
                        <p className="text-[11px] text-teal-900 bg-teal-50 p-2 rounded border border-teal-200">
                          Admin Note: {img.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-500 font-mono">
                    Submitted: {new Date(img.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StaffUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        schoolName="ZPHS Penamaluru"
        onUploadSuccess={fetchMeals}
      />
    </div>
  );
};
