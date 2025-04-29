import { useEffect, useState } from 'react';
export function useReferralCode() {
    const [referralCode, setReferralCode] = useState(null);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            console.log('Referral code:', ref);
            setReferralCode(ref);
            localStorage.setItem("referralCode", ref);
            // Store it in localStorage or send to your backend
        }
    }, []);
    return referralCode;
}
