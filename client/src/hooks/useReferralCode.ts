import { useEffect, useState } from "react";

export function useAffiliateSaleCode() {
  const [AffiliateSaleCode, setAffiliateSaleCode] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    console.log("params", params);
    console.log("in hook", ref);
    if (ref) {
      // console.log('AffiliateSale code:', ref);
      setAffiliateSaleCode(ref);
      localStorage.setItem("AffiliateSaleCode", ref);
      // Store it in localStorage or send to your backend
    }
  }, []);
  return AffiliateSaleCode;
}
