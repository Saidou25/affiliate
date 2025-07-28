import { useState } from "react";
import TriggerEmailButton from "./TriggerEmailButton";
import { Affiliate } from "../types";
import Button from "./Button";

type Props = {
  affiliateData: Affiliate;
};

type FormState = {
  affiliateEmail: string;
  title: string;
  text: string;
};

export default function EmailForm({ affiliateData }: Props) {
  const [formState, setFormState] = useState<FormState>({
    affiliateEmail: affiliateData?.email,
    title: "",
    text: "",
  });

  const [shouldSendEmail, setShouldSendEmail] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShouldSendEmail(true); // triggers email
  };

  return (
    <form className="notification-form" onSubmit={handleSubmit}>
      <h3>Compose your Email</h3>

      <label htmlFor="email">Email</label>
      <input
        type="text"
        id="email"
        name="email"
        value={affiliateData?.email}
         style={{ fontStyle: "oblique", color: "grey" }}
        readOnly
      />
      <label htmlFor="title">Title</label>
      <input
        type="text"
        id="title"
        name="title"
        value={formState.title}
        onChange={handleChange}
        required
      />

      <label htmlFor="text">Message</label>
      <textarea
        id="text"
        name="text"
        value={formState.text}
        onChange={handleChange}
        rows={4}
        required
      />

      <div className="button-div-notification-form">
        <Button
          className="blue-btn"
          type="submit"
          disabled={!formState.text || !formState.title}
          style={{ width: "100%" }}
        >
          Send Email
        </Button>
      </div>

      {/* Email trigger component */}
      {shouldSendEmail && (
        <TriggerEmailButton
          refId={affiliateData.refId}
          affiliateEmail={formState.affiliateEmail}
          title={formState.title}
          text={formState.text}
          onSent={() => setShouldSendEmail(false)}
        />
      )}
    </form>
  );
}
