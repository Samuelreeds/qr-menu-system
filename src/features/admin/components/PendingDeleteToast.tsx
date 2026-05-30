// src/features/admin/components/PendingDeleteToast.tsx
interface PendingDelete {
  productId: string;
  name: string;
  timeLeft: number;
}

interface PendingDeleteToastProps {
  pendingDelete: PendingDelete | null;
  onUndo: () => void;
}

export default function PendingDeleteToast({ pendingDelete, onUndo }: PendingDeleteToastProps) {
  if (!pendingDelete) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] w-[90vw] max-w-sm bg-gray-900 shadow-2xl p-2 rounded-2xl flex flex-row items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 print:hidden">
      <div className="flex items-center flex-1 min-w-0 overflow-hidden pl-2">
        <span className="text-sm text-gray-300 truncate w-full flex items-center gap-2">
          <span>Deleted <span className="font-bold text-white">"{pendingDelete.name}"</span></span>
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 pr-1">
        <span className="text-xs font-bold px-2 py-1 bg-white/10 text-white rounded-lg">
          {pendingDelete.timeLeft}s
        </span>
        <button 
          type="button" 
          onClick={onUndo} 
          className="text-gray-900 font-bold text-sm bg-white px-4 py-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-transform"
        >
          Undo
        </button>
      </div>
    </div>
  );
}