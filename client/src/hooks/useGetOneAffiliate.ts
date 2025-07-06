import { useEffect, useState } from "react";

export function useGetOneAffiliate(refId: string) {
  const [idea, setIdea] = useState("");
  useEffect(() => {
    if (refId) {
      setIdea(refId);
    }
  }, [refId]);
  return idea;
}
