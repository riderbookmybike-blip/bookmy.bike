import React, { useState } from 'react';
import { MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Dummy Pincode Data (would normally come from API/CSV)
const VALID_PINCODES: Record<string, string> = {
    // Delhi NCR
    '110001': 'New Delhi', '110002': 'Daryaganj', '110003': 'Aliganj', '110020': 'Okhla',
    '110017': 'Malviya Nagar', '110019': 'Kalkaji', '110025': 'New Friends Colony',
    '122001': 'Gurgaon', '201301': 'Noida',

    // Mumbai
    '400001': 'Mumbai GPO', '400050': 'Bandra West', '400053': 'Andheri West',
    '400076': 'Powai', '400093': 'Chakala', '400028': 'Dadar West',
    '400018': 'Worli', '400005': 'Colaba',

    // Bangalore
    '560001': 'Bangalore GPO', '560034': 'Koramangala', '560038': 'Indiranagar',
    '560066': 'Whitefield', '560100': 'Electronic City', '560076': 'JP Nagar',

    // Chennai
    '600001': 'Chennai GPO', '600018': 'Teynampet', '600096': 'Perungudi',
    '600100': 'Medavakkam', '600017': 'T. Nagar',

    // Kolkata
    '700001': 'Kolkata GPO', '700091': 'Salt Lake', '700053': 'New Alipore',
    '700016': 'Park Street', '700020': 'Bhowanipore',

    // Hyderabad
    '500001': 'Hyderabad GPO', '500032': 'Gachibowli', '500081': 'Madhapur',
    '500034': 'Banjara Hills', '500033': 'Jubilee Hills',

    // Pune
    '411001': 'Pune GPO', '411057': 'Hinjewadi', '411014': 'Viman Nagar',
    '411038': 'Kothrud', '411027': 'Aundh',

    // Other Majors
    '302001': 'Jaipur', '380001': 'Ahmedabad', '440001': 'Nagpur',
    '226001': 'Lucknow', '452001': 'Indore', '160017': 'Chandigarh'
};

export default function DeliveryChecker() {
    const [pincode, setPincode] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'VALID' | 'INVALID'>('IDLE');
    const [city, setCity] = useState('');

    const checkPincode = async () => {
        if (pincode.length !== 6) return;
        setStatus('LOADING');

        // Simulate API delay
        setTimeout(() => {
            if (VALID_PINCODES[pincode]) {
                setStatus('VALID');
                setCity(VALID_PINCODES[pincode]);
            } else {
                setStatus('INVALID');
                setCity('');
            }
        }, 1000);
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
                            <CheckCircle size={12} /> {city}
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
