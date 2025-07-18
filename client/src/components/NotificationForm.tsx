import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_NOTIFICATION } from "../utils/mutations";
import { Affiliate } from "../types";
import Spinner from "./Spinner";

import "./NotificationForm.css";
import Button from "./Button";

type Props = {
  affiliateData: Affiliate | null;
};

export default function NotificationForm({ affiliateData }: Props) {
  const [formState, setFormState] = useState({
    refId: "",
    title: "",
    text: "",
  });

  const [createNotification] = useMutation(CREATE_NOTIFICATION);
  const [status, setStatus] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createNotification({
        variables: {
          refId: formState.refId,
          title: formState.title,
          text: formState.text,
        },
      });
      setFormState({ refId: "", title: "", text: "" });
      setStatus("success");
      setLoading(false);
    } catch (error) {
      console.error("Error creating notification:", error);
      setStatus("error");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (affiliateData?.refId) {
      setFormState((prev) => ({ ...prev, refId: affiliateData.refId }));
    }
  }, [affiliateData]);

  return (
    <form className="notification-form" onSubmit={handleSubmit}>
      <h3>Create Notification</h3>
      <br />
      <label htmlFor="refId">Affiliate Ref ID</label>
      <br />
      <input
        type="text"
        id="refId"
        name="refId"
        value={formState.refId}
        onChange={handleChange}
        required
        style={{ fontStyle: "oblique" }}
        placeholder={formState.refId}
      />
      <br />
      <br />
      <label htmlFor="title">Title</label>
      <br />
      <input
        type="text"
        id="title"
        name="title"
        value={formState.title}
        onChange={handleChange}
        required
      />
      <br />
      <br />
      <label htmlFor="text">Message</label>
      <br />
      <textarea
        id="text"
        name="text"
        value={formState.text}
        onChange={handleChange}
        rows={4}
        required
      />
      <br />
      <br />
      <div className="button-div-notification-form">
        <Button
          className="blue-btn"
          type="submit"
          disabled={
            !formState.refId || !formState.text || !formState.title || loading
          }
          style={{ width: "100%" }}
        >
          {loading ? <Spinner /> : "Send Notification"}
        </Button>
      </div>
      {status === "success" && (
        <p className="success">✅ Notification sent successfully!</p>
      )}
      {status === "error" && (
        <p className="error">❌ Failed to send notification.</p>
      )}
    </form>
  );
}
