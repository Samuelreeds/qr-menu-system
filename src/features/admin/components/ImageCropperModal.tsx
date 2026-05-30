// src/features/admin/components/ImageCropperModal.tsx
import Cropper from 'react-easy-crop';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  crop: { x: number; y: number };
  zoom: number;
  aspect: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  crop,
  zoom,
  aspect,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onClose,
  onSave
}: ImageCropperModalProps) {
  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur flex flex-col print:hidden animate-in fade-in">
       <div className="flex-1 relative">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
          />
       </div>
       <div className="p-6 bg-white flex justify-end gap-4 shrink-0 rounded-t-[32px]">
          <button onClick={onClose} className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all">Cancel</button>
          <button onClick={onSave} className="px-6 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 active:scale-95 transition-all">Save Crop</button>
       </div>
    </div>
  );
}