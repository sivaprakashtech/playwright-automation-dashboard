import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ title, children, onClose, size = 'md' }: ModalProps) {
  const widthClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative ${widthClass} w-full bg-dark-800/95 backdrop-blur-xl border border-dark-700/50 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/50">
          <h2 id="modal-title" className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-dark-700/50 text-dark-400 hover:text-dark-200 transition-colors" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}
