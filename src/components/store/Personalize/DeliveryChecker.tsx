import React, { useState } from 'react';
import { MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getPincodeDetails } from '@/actions/pincode';



export default function DeliveryChecker() {
    const [pincode, setPincode] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'VALID' | 'INVALID'>('IDLE');
    const [taluka, setTaluka] = useState('');

    const checkPincode = async () => {
        if (pincode.length !== 6) return;
        setStatus('LOADING');

        try {
            const result = await getPincodeDetails(pincode);
            if (result.success && result.data) {
                const locData = result.data;
                setStatus('VALID');
                setTaluka(locData.taluka);

                // Save to localStorage for other components (like ProfileDropdown)
                const storageData = {
                    pincode: locData.pincode,
                    area: locData.area,
                    taluka: locData.taluka,
                    state: locData.state,
                    stateCode: locData.state_code || '' // Ensure state_code is handled if available
                };
                localStorage.setItem('bkmb_user_pincode', JSON.stringify(storageData));

                // Dispatch event for reactive updates
                window.dispatchEvent(new Event('locationChanged'));
            } else {
                setStatus('INVALID');
                setTaluka('');
            }
        } catch (error) {
            console.error('Error checking pincode:', error);
            setStatus('INVALID');
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-slate-400">
                <MapPin size={20} />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Check Delivery</p>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter Pincode"
                        value={pincode}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setPincode(val);
                            if (val.length !== 6) setStatus('IDLE');
                        }}
                        className="bg-transparent text-sm font-black italic text-white placeholder:text-slate-700 outline-none w-28 uppercase tracking-wider"
                    />
                    {status === 'IDLE' && pincode.length === 6 && (
                        <button onClick={checkPincode} className="text-[10px] font-bold text-blue-500 uppercase hover:text-white transition-colors">
                            Check
                        </button>
                    )}
                    {status === 'LOADING' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                    {status === 'VALID' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                            <CheckCircle size={12} /> {taluka}
                        </span>
                    )}
                    {status === 'INVALID' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                            <XCircle size={12} /> Not Available
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
