import React, { useEffect } from "react";

interface SuccessNotificationProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  show,
  onClose,
  title = "创建成功",
  message = "围栏已成功添加到系统"
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-green-500/40 shadow-2xl p-8 min-w-[360px] text-center animate-in zoom-in duration-200">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-green-400">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-300 text-base mb-6">{message}</p>
        
        <button
          onClick={onClose}
          className="px-8 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all hover:scale-105 active:scale-95"
        >
          知道了
        </button>
      </div>
    </div>
  );
};
