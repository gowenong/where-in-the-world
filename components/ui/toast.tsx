import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation before closing
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = "fixed bottom-4 right-4 p-4 rounded-md shadow-lg transition-all duration-300 flex items-center";
  const typeClasses = type === 'success' 
    ? "bg-green-500 text-white" 
    : "bg-red-500 text-white";

  return (
    <div className={`${baseClasses} ${typeClasses} ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <span className="mr-2">{message}</span>
      <button onClick={() => setIsVisible(false)} className="ml-auto">
        <X size={18} />
      </button>
    </div>
  );
}