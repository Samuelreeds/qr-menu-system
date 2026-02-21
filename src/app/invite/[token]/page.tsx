import { validateInviteToken } from '@/lib/actions';
import InviteForm from './InviteForm';
import { ShieldAlert, PartyPopper } from 'lucide-react';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  // Unwrap the params Promise here (Next.js 15 requirement)
  const { token } = await params;
  
  const check = await validateInviteToken(token);

  if (!check.valid || !check.invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-gray-500 text-sm">{check.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
            <PartyPopper size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">You're Invited!</h1>
          <p className="text-sm font-medium text-gray-500 mt-2">Set up your digital menu and claim your 7-Day PRO Trial.</p>
        </div>

        <InviteForm invite={check.invite} token={token} />
        
        <p className="text-[10px] text-center text-gray-400 mt-6 font-medium">
          After 7 days, your account will automatically downgrade to the FREE view-only tier unless upgraded.
        </p>
      </div>
    </div>
  );
}