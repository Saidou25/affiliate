import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useWindowWidth } from "../hooks/useWindowWith";
import { IoPersonCircleOutline } from "react-icons/io5";
import {
  FiCalendar,
  FiCamera,
  FiHash,
  FiMail,
  FiPercent,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import { SiStripe } from "react-icons/si";
import { formatDateLocal } from "../utils/formatDateLocal";
import Spinner from "./Spinner";
import useUpdateAffiliate from "../hooks/useUpdateAffiliate";
import Button from "./Button";
import Banner from "./Banner";

import "./Profile.css";
import { useLocation } from "react-router-dom";

type EditableProfile = {
  name?: string;
  email?: string;
  avatar?: string;
};

export default function Profile() {
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [tempProfile, setTempProfile] = useState<EditableProfile | null>(null);
  const [editingRow, setEditingRow] = useState(""); // which field is being edited ("" = none)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null); // NEW: success banner state
  const [isUploading, setIsUploading] = useState(false);
  const [inProfile, setInProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const location = useLocation();
  const pageUrl = `${window.location.origin}${location.pathname}${location.search}${location.hash}`;

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
    if (editingRow === "name") {
      const val = (tempProfile?.name ?? "").trim();
      if (val.length < 2) next.name = "Name must be at least 2 characters.";
    }
    if (editingRow === "email") {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempProfile((prev) => ({ ...(prev ?? {}), [name]: value }));
    if (name === "name" || name === "email")
      clearFieldError(name as "name" | "email");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const validation = validateAvatarFile(file);
    if (validation) {
      setUploadError(validation);
      setIsUploading(false);
      e.target.value = ""; // allow reselecting same file
      return;
    }
    setEditingRow("avatar");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(uploadUrl, formData);
      const secureUrl = res.data.secure_url;
      setTempProfile((prev) => ({ ...(prev ?? {}), avatar: secureUrl }));
      if (secureUrl) {
        setIsUploading(false);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setIsUploading(false);
      setUploadError(
        "We couldn’t upload your photo. Try a smaller image or a different file type."
      );
      e.target.value = "";
    } finally {
      setIsUploading(false);
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
        setEditingRow("");
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
    setEditingRow("");
    setUploadError(null);
    setIsUploading(false);
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

  useEffect(() => {
    if (pageUrl.includes("/profile")) {
      console.log("there is profile in url: ", pageUrl);
      setInProfile(true);
    }
  }, []);

  if (!me || !profile || !tempProfile) return <p>Loading...</p>;

  return (
    // <div className="profile-container" style={{ maxWidth: `${profileContainerWidth}%`, border: "1px solid", borderColor: "info", margin: "auto"  }}>
    <div className="row">
      <div
        // className="col-12"
        className={
          !inProfile
            ? "col-12"
            : "col-xm-12 col-sm-12 col-md-10 col-lg-9 col-xl-9"
        }
        style={{
          margin: "auto",
          justifyContent: "center",
        }}
      >
        <div className="row">
          <div className="col-xm-12 col-sm-12 col-md-12 col-lg-12 col-xl-12">
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
              <div className="col-xs-12 col-sm-5 col-md-4 icon-column">
                <IoPersonCircleOutline className="profile-icon" aria-hidden />
                <strong>Avatar - </strong>
                <div className="avatar-box">
                  {tempProfile.avatar && !isUploading ? (
                    <img
                      src={tempProfile.avatar}
                      alt="Avatar"
                      className="avatar-img"
                    />
                  ) : !tempProfile.avatar && !isUploading ? (
                    <IoPersonCircleOutline className="avatar-img" />
                  ) : (
                    <Spinner message="full-page" />
                  )}
                </div>
              </div>
              <div className="col-xs-12 col-sm-4 col-md-3 col-lg-3 col-xl-3 edit-btn-row">
                {editingRow !== "avatar" && !editingRow && (
                  <Button
                    className="blue-btn-image-setting"
                    onClick={() => setEditingRow("avatar")}
                    type="button"
                  >
                    Edit
                  </Button>
                )}
              </div>
              {editingRow === "avatar" && (
                <div className="row avatar-row g-0">
                  {width > 576 && (
                    <div className="col-xs-12 col-sm-6 col-md-8 col-lg-8 ">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        ref={fileInputRef}
                        className="hidden-input"
                      />
                      <Button
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
                        className="blue-btn-image-setting"
                        type="button"
                        disabled={isUploading}
                      >
                        <FiCamera className="me-1" aria-hidden />
                        Choose Photo
                      </Button>
                    </div>
                  )}
                  <div className="col-xs-12 col-sm-4 col-md-4 col-lg-3 avatar-btn">
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
                          className="blue-btn-image-setting m-0"
                          type="button"
                        >
                          <FiCamera className="me-1" aria-hidden />
                          Choose Photo
                        </Button>
                      </>
                    )}
                    <Button
                      className="blue-btn-image-setting"
                      onClick={saveChanges}
                      type="button"
                      disabled={updating || isUploading}
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
                  <div className="col-sx-12 col-sm-9 col-md-8 col-lg-9 col-xl-9 icon-column">
                    <FiUser className="profile-icon" aria-hidden />
                    <strong>Name - </strong>
                    <span>{me.name}</span>
                  </div>
                  <div className="col-3 edit-btn-row">
                    {editingRow !== "name" && !editingRow && (
                      <Button
                        className="blue-btn-image-setting"
                        onClick={() => setEditingRow("name")}
                        type="button"
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {editingRow === "name" && (
                  <div className="row btn-row g-0">
                    <div className="col-xs-12 col-sm-6 col-md-8 col-lg-8">
                      <input
                        name="name"
                        value={tempProfile.name || ""}
                        onChange={handleChange}
                        className={`input ${errors.name ? "is-invalid" : ""}`}
                        aria-invalid={errors.name ? "true" : undefined}
                        aria-describedby={
                          errors.name ? "name-error" : undefined
                        }
                      />
                      {errors.name && (
                        <div id="name-error" className="invalid-feedback">
                          {errors.name}
                        </div>
                      )}
                    </div>
                    <div className="col-xs-12 col-sm-4 col-md-3 col-lg-3 row-edit-cancel">
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
                <div className="col-sx-12 col-sm-9 col-md-9 col-lg-9 col-xl-9 icon-column">
                  <FiMail className="profile-icon" aria-hidden />
                  <strong>Email - </strong>
                  {me.email}
                </div>
                <div className="col-3 edit-btn-row">
                  {editingRow !== "email" && !editingRow && (
                    <Button
                      className="blue-btn-image-setting"
                      onClick={() => setEditingRow("email")}
                      type="button"
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {editingRow === "email" && (
                  <div className="row btn-row g-0 mt-3">
                    <div className="col-xs-12 col-sm-6 col-md-8 col-lg-8">
                      <input
                        name="email"
                        type="email"
                        value={tempProfile.email || ""}
                        onChange={handleChange}
                        className={`input ${errors.email ? "is-invalid" : ""}`}
                        aria-invalid={errors.email ? "true" : undefined}
                        aria-describedby={
                          errors.email ? "email-error" : undefined
                        }
                      />
                      {errors.email && (
                        <div id="email-error" className="invalid-feedback">
                          {errors.email}
                        </div>
                      )}
                    </div>
                    <div className="col-xs-12 col-sm-4 col-md-3 col-lg-3 row-edit-cancel">
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
              <div className="col-sx-12 col-sm-9 col-md-9 col-lg-9 col-xl-9 icon-column">
                <FiPhone className="profile-icon" aria-hidden />
                <strong>Phone - </strong>
                {me.phone ? me.phone : "910-773-0646"}
              </div>
              <div className="col-3 edit-btn-row">
                {editingRow !== "phone" && !editingRow && (
                  <Button
                    className="blue-btn-image-setting"
                    onClick={() => setEditingRow("phone")}
                    type="button"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Phone row (edit) */}
            {editingRow === "phone" && (
              <div className="row btn-row g-0">
                <div className="col-xs-12 col-sm-6 col-md-8 col-lg-8">
                  <input
                    name="phone" // NOTE: ensure EditableProfile includes: phone?: string
                    type="tel"
                    // value={tempProfile.phone || ""}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div className="col-xs-12 col-sm-4 col-md-3 col-lg-3 row-edit-cancel">
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
              <div className="col-sx-12 col-sm-9 col-md-9 col-lg-9 col-xl-9 mb-3 icon-column">
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
                {formatDateLocal(me.createdAt)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
