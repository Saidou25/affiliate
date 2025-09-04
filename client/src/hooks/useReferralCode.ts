import { useEffect, useState } from "react";

export function useAffiliateSaleCode() {
  const [AffiliateSaleCode, setAffiliateSaleCode] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refId = params.get("ref");
    console.log("params", params);
    console.log("in hook", refId);
    if (refId) {
      // console.log('AffiliateSale code:', ref);
      setAffiliateSaleCode(refId);
      localStorage.setItem("AffiliateSaleCode", refId);
      // Store it in localStorage or send to your backend
    }
  }, []);
  return AffiliateSaleCode;
}
