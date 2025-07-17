// hooks/useSendEmail.ts
import { useEffect } from "react";
import { useMutation } from "@apollo/client";
import { SEND_EMAIL } from "../utils/mutations";
import { SendEmailArgs } from "../types";

type UseSendEmailOptions = {
  args: SendEmailArgs;
  trigger: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useSendEmail({
  args,
  trigger,
  onSuccess,
  onError,
}: UseSendEmailOptions) {
  const [sendEmailMutation, { loading, error, data }] = useMutation(SEND_EMAIL);

  useEffect(() => {
    if (trigger) {
      sendEmailMutation({ variables: { input: args } })
        .then(() => {
          onSuccess?.();
        })
        .catch((err) => {
          console.error("❌ sendEmail error", err);
          onError?.(err);
        });
    }
  }, [trigger]);

  return { loading, error, data };
}
