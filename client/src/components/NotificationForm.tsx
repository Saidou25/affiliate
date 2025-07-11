import { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_NOTIFICATION } from "../utils/mutations";
import "./NotificationForm.css";

export default function NotificationForm() {
  const [formState, setFormState] = useState({
    refId: "",
    title: "",
    text: "",
  });

  const [createNotification] = useMutation(CREATE_NOTIFICATION);
  const [status, setStatus] = useState<"success" | "error" | "">("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (error) {
      console.error("Error creating notification:", error);
      setStatus("error");
    }
  };

  return (
    <form className="notification-form" onSubmit={handleSubmit}>
      <h3>Create Notification</h3>

      <label htmlFor="refId">Affiliate Ref ID</label>
      <input
        type="text"
        id="refId"
        name="refId"
        value={formState.refId}
        onChange={handleChange}
        required
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

      <button type="submit">Send Notification</button>

      {status === "success" && (
        <p className="success">✅ Notification sent successfully!</p>
      )}
      {status === "error" && (
        <p className="error">❌ Failed to send notification.</p>
      )}
    </form>
  );
}
