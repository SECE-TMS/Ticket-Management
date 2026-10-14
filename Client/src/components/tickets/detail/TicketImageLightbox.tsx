import { X } from 'lucide-react';
import { getAttachmentUrl } from '../../../lib/utils';

interface TicketImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function TicketImageLightbox({ imageUrl, onClose }: TicketImageLightboxProps) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full flex flex-col items-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 inline-flex items-center gap-1 text-sm font-bold text-white hover:text-[var(--gold)] cursor-pointer"
        >
          <X size={20} /> Close
        </button>
        <img
          src={getAttachmentUrl(imageUrl)}
          alt="Enlarged attachment"
          className="max-h-[80vh] w-auto rounded-2xl shadow-2xl object-contain border border-white/20"
        />
      </div>
    </div>
  );
}
