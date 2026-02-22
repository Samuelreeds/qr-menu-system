import { validateInviteToken } from '@/lib/actions';
import InviteForm from './InviteForm';
import { AlertCircle, Store } from 'lucide-react';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token as string;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
          <AlertCircle className="mx-auto h-14 w-14 text-red-500 mb-4" />
          <h1 className="text-2xl font-black text-gray-900">Missing Token</h1>
          <p className="text-gray-500 mt-2 font-medium">This registration link is missing its security token.</p>
        </div>
      </div>
    );
  }

  const validation = await validateInviteToken(token);

  if (!validation.valid || !validation.invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
          <AlertCircle className="mx-auto h-14 w-14 text-red-500 mb-4" />
          <h1 className="text-2xl font-black text-gray-900">Invalid Link</h1>
          <p className="text-gray-500 mt-2 font-medium">{validation.error || 'This invite link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-2xl mb-4">
            <Store className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Setup Your Shop</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Complete your registration to start your 7-day PRO trial.</p>
        </div>
        
        <InviteForm invite={validation.invite} token={token} />
      </div>
    </div>
  );
}