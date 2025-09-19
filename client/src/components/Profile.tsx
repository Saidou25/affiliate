import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Spinner from "./Spinner";
import useUpdateAffiliate from "../hooks/useUpdateAffiliate";
import Button from "./Button";
import Banner from "./Banner";
import { useWindowWidth } from "../hooks/useWindowWith";

// Feather (general UI)
import {
  FiUser,
  FiMail,
  FiPhone,
  FiHash,
  FiPercent,
  FiCreditCard,
  FiCalendar,
  FiCamera, // handy for "Change photo"
} from "react-icons/fi";

// Ionicons (nice avatar circle)
import { IoPersonCircleOutline } from "react-icons/io5";

// Simple Icons (brand-specific)
import { SiStripe } from "react-icons/si";

import "./Profile.css";

type EditableProfile = {
  name?: string;
  email?: string;
  avatar?: string;
};

export const fieldIcons = {
  avatar: IoPersonCircleOutline, // Profile picture
  name: FiUser, // Username / full name
  email: FiMail, // Email
  phone: FiPhone, // Phone
  refId: FiHash, // Reference ID
  commissionRate: FiPercent, // Commission rate
  stripeAccountId: SiStripe, // Stripe account (brand icon)
  affiliateSince: FiCalendar, // Affiliate since (createdAt)
  // optional extras:
  creditCardAlt: FiCreditCard, // Alternative for payout/payment
  changePhoto: FiCamera, // Use on "Choose/Change photo" button
} as const;

export default function Profile() {
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [tempProfile, setTempProfile] = useState<EditableProfile | null>(null);
  const [editRow, setEditRow] = useState(""); // which field is being edited ("" = none)
  const isEditing = editRow !== "";

  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null); // NEW: success banner state

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  const { update, updating, updateError } = useUpdateAffiliate();

  const { width } = useWindowWidth();

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  // --- Image validation (size/type) ---
  const MAX_FILE_MB = 3;
  const BYTES_PER_MB = 1024 * 1024;
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ] as const;

  const formatMB = (bytes: number) => `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;

  const validateAvatarFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return "Unsupported file type. Please upload a JPEG, PNG, WebP, or HEIC image.";
    }
    if (file.size > MAX_FILE_MB * BYTES_PER_MB) {
      return `File is too large (${formatMB(
        file.size
      )}). Maximum allowed is ${MAX_FILE_MB} MB.`;
    }
    return null;
  };

  // --- Field validation (name/email) ---
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateFields = (): boolean => {
    const next: typeof errors = {};
    if (editRow === "name") {
      const val = (tempProfile?.name ?? "").trim();
      if (val.length < 2) next.name = "Name must be at least 2 characters.";
    }
    if (editRow === "email") {
      const val = (tempProfile?.email ?? "").trim();
      if (!EMAIL_REGEX.test(val))
        next.email = "Please enter a valid email address.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const clearFieldError = (field: keyof typeof errors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  // --- Handlers ---
  const formatDate = (input: string | number | Date) => {
    const d = new Date(input);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/New_York",
    }).format(d);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempProfile((prev) => ({ ...(prev ?? {}), [name]: value }));
    if (name === "name" || name === "email")
      clearFieldError(name as "name" | "email");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (validation) {
      setUploadError(validation);
      e.target.value = ""; // allow reselecting same file
      return;
    }
    setUploadError(null);
    setEditRow("avatar");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(uploadUrl, formData);
      const secureUrl = res.data.secure_url;
      setTempProfile((prev) => ({ ...(prev ?? {}), avatar: secureUrl }));
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError(
        "We couldn’t upload your photo. Try a smaller image or a different file type."
      );
      e.target.value = "";
    }
  };

  const saveChanges = async () => {
    if (!validateFields()) return;
    if (!me?.id || !tempProfile) return;

    try {
      const updated = await update(tempProfile, me);
      if (updated) {
        setProfile(updated);
        setTempProfile(updated);
        setEditRow("");
        setUploadError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        setSavedMsg("Your profile has been updated."); // NEW: trigger success banner
      }
    } catch (err) {
      console.error("Failed to save changes:", err);
    }
  };

  const cancelEdit = () => {
    setTempProfile(profile);
    setEditRow("");
    setUploadError(null);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Auto-hide success after 4s (optional)
  useEffect(() => {
    if (!savedMsg) return;
    const t = setTimeout(() => setSavedMsg(null), 4000); // NEW
    return () => clearTimeout(t); // NEW
  }, [savedMsg]); // NEW

  // --- Init ---
  useEffect(() => {
    if (me) {
      setProfile(me);
      setTempProfile(me);
    }
  }, [me]);

  if (!me || !profile || !tempProfile) return <p>Loading...</p>;

  // --- UI ---
  return (
    <>
      {/* Success banner (auto-hides) */}
      {savedMsg && (
        <Banner
          variant="success"
          title="Changes saved"
          message={savedMsg}
          dismissible
          onClose={() => setSavedMsg(null)}
          className="mb-3"
          ariaLive="polite"
          role="status"
        />
      )}

      {/* Error banners */}
      {uploadError && (
        <Banner
          variant="error"
          title="Photo upload failed"
          message={uploadError}
          dismissible
          onClose={() => setUploadError(null)}
          className="mb-3"
          ariaLive="assertive"
          role="alert"
        />
      )}

      {updateError && (
        <Banner
          variant="error"
          title="Couldn't save your changes"
          message={
            typeof updateError === "string"
              ? updateError
              : updateError?.message || "Please try again in a moment."
          }
          dismissible
          className="mb-3"
          ariaLive="assertive"
          role="alert"
        />
      )}

      {/* Avatar */}
      <div className="row row-profile-settings g-0 mb-3 align-items-center">
        <div className="col-5 avatar-column icon-column gap-2">
          <IoPersonCircleOutline className="profile-icon" aria-hidden />
          <strong>Avatar - </strong>
          {tempProfile.avatar ? (
            <img src={tempProfile.avatar} alt="Avatar" className="avatar-img" />
          ) : (
            <IoPersonCircleOutline className="avatar-img" />
          )}
        </div>
        <div className="col-3 btn-row">
          {editRow !== "avatar" && !isEditing && (
            <Button
              className="blue-btn-image-setting"
              onClick={() => setEditRow("avatar")}
              type="button"
            >
              Edit
            </Button>
          )}
        </div>
        {editRow === "avatar" && (
          <div className="row row-edit-cancel g-0">
            {width > 576 && (
              <div className="col-xs-12 col-sm-6 col-md-8 col-lg-8 avatar-btn-row">
                {/* <> */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  ref={fileInputRef}
                  className="hidden-input"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="blue-btn-image-setting"
                  type="button"
                >
                  <FiCamera className="me-1" aria-hidden />
                  Choose Photo
                </Button>
                {/* </> */}
              </div>
            )}
            <div className="col-xs-12 col-sm-3 col-md-3 col-lg-3 btn-row">
              {width < 576 && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    ref={fileInputRef}
                    className="hidden-input"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="blue-btn-image-setting"
                    type="button"
                  >
                    Choose Photo
                  </Button>
                </>
              )}
              <Button
                className="blue-btn-image-setting"
                onClick={saveChanges}
                type="button"
                disabled={updating}
              >
                {updating ? <Spinner /> : <span>Save</span>}
              </Button>
              <Button
                className="orange-btn-image-setting"
                onClick={cancelEdit}
                type="button"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="profile-label-underline" />

      {/* Name row */}
      {me.name && (
        <>
          <div className="row row-profile-settings g-0 mb-3">
            <div className="col-9 icon-column">
              <FiUser className="profile-icon" aria-hidden />
              <strong>Name - </strong>
              <span>{me.name}</span>
            </div>
            <div className="col-3 btn-row">
              {editRow !== "name" && !isEditing && (
                <Button
                  className="blue-btn-image-setting"
                  onClick={() => setEditRow("name")}
                  type="button"
                >
                  Edit
                </Button>
              )}
            </div>
          </div>

          {editRow === "name" && (
            <div className="row row-edit-cancel g-0">
              <div className="col-xs-12 col-sm-6 col-md-8 col-lg-8">
                <input
                  name="name"
                  value={tempProfile.name || ""}
                  onChange={handleChange}
                  className={`input ${errors.name ? "is-invalid" : ""}`}
                  aria-invalid={errors.name ? "true" : undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <div id="name-error" className="invalid-feedback">
                    {errors.name}
                  </div>
                )}
              </div>
              <div className="col-xs-12 col-sm-3 col-md-3 col-lg-3 btn-row">
                <Button
                  className="blue-btn-image-setting"
                  onClick={saveChanges}
                  type="button"
                  disabled={updating}
                >
                  {updating ? <Spinner /> : <span>Save</span>}
                </Button>
                <Button
                  className="orange-btn-image-setting"
                  onClick={cancelEdit}
                  type="button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      <div className="profile-label-underline" />

      {/* Email row */}
      {me.email && (
        <div className="row row-profile-settings g-0 mb-3">
          <div className="col-9 icon-column">
            <FiMail className="profile-icon" aria-hidden />
            <strong>Contact Email - </strong>
            {me.email}
          </div>
          <div className="col-3 btn-row">
            {editRow !== "email" && !isEditing && (
              <Button
                className="blue-btn-image-setting"
                onClick={() => setEditRow("email")}
                type="button"
              >
                Edit
              </Button>
            )}
          </div>

          {editRow === "email" && (
            <div className="row row-edit-cancel g-0 mt-3">
              <div className="col-xs-12 col-sm-6 col-md-8 col-lg-8">
                <input
                  name="email"
                  type="email"
                  value={tempProfile.email || ""}
                  onChange={handleChange}
                  className={`input ${errors.email ? "is-invalid" : ""}`}
                  aria-invalid={errors.email ? "true" : undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <div id="email-error" className="invalid-feedback">
                    {errors.email}
                  </div>
                )}
              </div>
              <div className="col-xs-12 col-sm-3 col-md-3 col-lg-3 btn-row">
                <Button
                  className="blue-btn-image-setting"
                  onClick={saveChanges}
                  type="button"
                  disabled={updating}
                >
                  {updating ? <Spinner /> : <span>Save</span>}
                </Button>
                <Button
                  className="orange-btn-image-setting"
                  onClick={cancelEdit}
                  type="button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="profile-label-underline" />

      {/* Phone row (display) */}
      <div className="row row-profile-settings g-0 mb-3">
        <div className="col-9 icon-column">
          <FiPhone className="profile-icon" aria-hidden />
          <strong>Contact Phone Number (optional) - </strong>
          {me.phone ? me.phone : <span className="text-muted">Not set</span>}
        </div>
        <div className="col-3 btn-row">
          {editRow !== "phone" && !isEditing && (
            <Button
              className="blue-btn-image-setting"
              onClick={() => setEditRow("phone")}
              type="button"
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Phone row (edit) */}
      {editRow === "phone" && (
        <div className="row row-edit-cancel g-0">
          <div className="col-xs-12 col-sm-6 col-md-8 col-lg-8">
            <input
              name="phone" // NOTE: ensure EditableProfile includes: phone?: string
              type="tel"
              // value={tempProfile.phone || ""}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div className="col-xs-12 col-sm-3 col-md-3 col-lg-3 btn-row">
            <Button
              className="blue-btn-image-setting"
              onClick={saveChanges}
              type="button"
              disabled={updating}
            >
              {updating ? <Spinner /> : <span>Save</span>}
            </Button>
            <Button
              className="orange-btn-image-setting"
              onClick={cancelEdit}
              type="button"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="profile-label-underline" />

      {/* Read-only extras */}
      {me.refId && (
        <div className="mb-3 icon-column">
          <FiHash className="profile-icon" aria-hidden />
          <strong>Reference id - </strong>
          {me.refId}
        </div>
      )}
      <div className="profile-label-underline" />

      {me.commissionRate && (
        <div className="mb-3 icon-column">
          <FiPercent className="profile-icon" aria-hidden />
          <strong>Commission Rate - </strong>
          {me.commissionRate * 100}%
        </div>
      )}
      <div className="profile-label-underline" />

      {me.stripeAccountId && (
        <div className="mb-3 icon-column">
          <SiStripe className="profile-icon" aria-hidden />
          <strong>Stripe Account Id - </strong>
          {me.stripeAccountId}
        </div>
      )}
      <div className="profile-label-underline" />

      {me.createdAt && (
        <div className="mb-3 icon-column">
          <FiCalendar className="profile-icon" aria-hidden />
          <strong>Affiliate since - </strong>
          {formatDate(me.createdAt)}
        </div>
      )}
    </>
  );
}
