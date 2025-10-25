import { useState, useEffect } from 'react';
import { X, Clock, Pill, CheckCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationData {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  scheduleId?: string;
}

interface MedicineReminderNotificationProps {
  notification: NotificationData | null;
  onDismiss: () => void;
  onTake: () => void;
  onSnooze: () => void;
}

export default function MedicineReminderNotification({
  notification,
  onDismiss,
  onTake,
  onSnooze,
}: MedicineReminderNotificationProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (notification) {
      // Slide in animation
      setIsVisible(true);
      setProgress(100);

      // Auto-dismiss progress bar (30 seconds)
      const duration = 30000;
      const interval = 100;
      const decrement = (interval / duration) * 100;

      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - decrement;
          if (newProgress <= 0) {
            clearInterval(progressTimer);
            handleDismiss();
            return 0;
          }
          return newProgress;
        });
      }, interval);

      return () => clearInterval(progressTimer);
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleTake = () => {
    setIsVisible(false);
    setTimeout(() => {
      onTake();
    }, 300);
  };

  const handleSnooze = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSnooze();
    }, 300);
  };

  const handleViewSchedule = () => {
    navigate('/schedule');
    handleDismiss();
  };

  if (!notification) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-[9998] ${
          isVisible ? 'opacity-30' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleDismiss}
      />

      {/* Mobile-style notification bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-[9999] transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Safe area for mobile notch */}
        <div className="safe-area-top bg-gradient-to-b from-primary-600 to-primary-700" />

        <div className="bg-gradient-to-b from-primary-600 to-primary-700 shadow-2xl">
          <div className="max-w-md mx-auto">
            {/* Notification content */}
            <div className="px-4 pt-3 pb-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Pill className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Bell size={14} className="text-white/90" />
                      <p className="text-xs font-semibold text-white/90 uppercase tracking-wide">
                        Medicine Reminder
                      </p>
                    </div>
                    <p className="text-sm text-white/70 flex items-center mt-0.5">
                      <Clock size={12} className="mr-1" />
                      {notification.time}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              {/* Medicine info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-3 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-1">
                  {notification.medicineName}
                </h3>
                <p className="text-white/80 text-sm">
                  Take {notification.dosage}
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={handleTake}
                  className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all transform active:scale-95"
                >
                  <CheckCircle size={18} />
                  <span>Take Now</span>
                </button>
                <button
                  onClick={handleSnooze}
                  className="flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-xl border border-white/30 transition-all transform active:scale-95"
                >
                  <Clock size={18} />
                  <span>Snooze 5m</span>
                </button>
              </div>

              <button
                onClick={handleViewSchedule}
                className="w-full text-center text-white/80 hover:text-white text-sm py-2 transition-colors"
              >
                View Schedule →
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/20">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Shadow effect */}
        <div className="h-4 bg-gradient-to-b from-black/10 to-transparent" />
      </div>
    </>
  );
}
