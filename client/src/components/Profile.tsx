import { useLocation } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useEffect, useRef, useState } from "react";
import { IoPersonCircleOutline } from "react-icons/io5";
import axios from "axios";
import Spinner from "./Spinner";
import useUpdateAffiliate from "../hooks/useUpdateAffiliate";

import "./Profile.css";
import Button from "./Button";

type EditableProfile = {
  name?: string;
  email?: string;
  avatar?: string;
};

export default function Profile() {
  const [settings, setSettings] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [tempProfile, setTempProfile] = useState<EditableProfile | null>(null);

  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  const { update, updating, updateError } = useUpdateAffiliate();

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempProfile({ ...tempProfile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(uploadUrl, formData);
      const secureUrl = res.data.secure_url;
      setTempProfile({ ...tempProfile, avatar: secureUrl });
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const saveChanges = async () => {
    try {
      if (!me?.id || !tempProfile) return;

      const updated = await update(tempProfile, me);

      // Update local profile state with the response
      if (updated) {
        setProfile(updated);
        setTempProfile(updated);
        setEditing(false);
      }
    } catch (err) {
      console.error("Failed to save changes:", err);
    }
  };

  const cancelEdit = () => {
    setTempProfile(profile);
    setEditing(false);
  };

  useEffect(() => {
    if (me) {
      setProfile(me);
      setTempProfile(me);
    }
  }, [me]);

  useEffect(() => {
    if (location.pathname.includes("settings")) {
      setSettings(true);
    } else {
      setSettings(false);
    }
  }, [location.pathname]);

  if (!me || !profile || !tempProfile) return <p>Loading...</p>;

  if (settings) {
    return (
      <p>
        {me.name && (
          <>
            <strong>Name - </strong>
            {me.name}
            <br />
          </>
        )}
        {me.email && (
          <>
            <strong>Email - </strong>
            {me.email}
            <br />
          </>
        )}
        {me.refId && (
          <>
            <strong>My reference id - </strong>
            {me.refId} <br />
          </>
        )}
        {me.commissionRate && (
          <>
            <strong>Commission rate - </strong>
            {me.commissionRate * 100}%<br />
          </>
        )}
      </p>
    );
  }

  return (
    <div className="modern-profile-card">
      <div className="avatar-section">
        {tempProfile.avatar ? (
          <img
            src={tempProfile.avatar}
            alt="Avatar"
            className="avatar-img me-3"
          />
        ) : (
          <IoPersonCircleOutline className="avatar-img me-3" />
        )}

        {editing && (
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
              className="blue-btn"
              type="button"
            >
              Change Photo
            </Button>
          </>
        )}
      </div>

      <div className="profile-info">
        <div className="field-group">
          <label>Name</label>
          {editing ? (
            <input
              name="name"
              value={tempProfile.name || ""}
              onChange={handleChange}
              className="input"
            />
          ) : (
            <p>{profile.name || "N/A"}</p>
          )}
        </div>

        <div className="field-group">
          <label>Email</label>
          {editing ? (
            <input
              name="email"
              value={tempProfile.email}
              onChange={handleChange}
              className="input"
            />
          ) : (
            <p>{profile.email}</p>
          )}
        </div>

        <div className="field-group">
          <label>Role</label>
          <p>{me.role}</p>
        </div>
        {updateError && <p className="error">Failed to save changes.</p>}
        <div className="btn-row">
          {editing ? (
            <>
              <Button className="blue-btn" onClick={saveChanges} type="button">
                {updating ? <Spinner /> : <span>Save</span>}
              </Button>
              <Button className="orange-btn" onClick={cancelEdit} type="button">
                Cancel
              </Button>
            </>
          ) : (
            <Button
              className="blue-btn"
              onClick={() => setEditing(true)}
              type="button"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
