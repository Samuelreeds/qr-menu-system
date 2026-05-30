// src/features/admin/components/UserActivityModal.tsx
import { X, Loader2 } from 'lucide-react';

interface UserActivityModalProps {
  isOpen: boolean;
  userEmail?: string;
  isLoading: boolean;
  activityData: any;
  onClose: () => void;
}

export default function UserActivityModal({
  isOpen,
  userEmail,
  isLoading,
  activityData,
  onClose
}: UserActivityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm p-4 flex justify-center items-center">
      <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Activity</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">{userEmail}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
          ) : activityData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Sales Generated</p>
                  <p className="text-3xl font-black text-gray-900">${activityData.totalSales.toFixed(2)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Orders Processed</p>
                  <p className="text-3xl font-black text-gray-900">{activityData.orders.length}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 text-sm">Recent Orders</h3>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white shadow-sm">
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="p-3 pl-4">Order ID</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 pr-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activityData.orders.slice(0, 50).map((o: any) => (
                        <tr key={o.id} className="hover:bg-gray-50/50">
                          <td className="p-3 pl-4 text-xs font-bold text-gray-900">{o.orderNumber || o.id.slice(0,8)}</td>
                          <td className="p-3 text-xs text-gray-500 font-medium">{o.orderType}</td>
                          <td className="p-3 text-xs font-bold text-gray-900">${o.total.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${o.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : o.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-3 pr-4 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {activityData.orders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-sm text-gray-400">No orders processed by this user.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 text-sm">Inventory Actions</h3>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white shadow-sm">
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="p-3 pl-4">Reason</th>
                        <th className="p-3">Change</th>
                        <th className="p-3">New Stock</th>
                        <th className="p-3 pr-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activityData.stockLogs.slice(0, 50).map((log: any) => (
                        <tr key={log.id} className="hover:bg-gray-50/50">
                          <td className="p-3 pl-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">{log.reason}</span>
                          </td>
                          <td className={`p-3 text-xs font-bold ${log.change > 0 ? 'text-green-500' : 'text-red-500'}`}>{log.change > 0 ? '+' : ''}{log.change}</td>
                          <td className="p-3 text-xs font-bold text-gray-900">{log.newStock}</td>
                          <td className="p-3 pr-4 text-xs text-gray-500">{new Date(log.timestamp).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {activityData.stockLogs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-sm text-gray-400">No inventory actions recorded.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-red-500">Failed to load activity data.</div>
          )}
        </div>
      </div>
    </div>
  );
}