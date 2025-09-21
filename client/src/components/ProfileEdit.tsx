import { useEffect, useRef, useState } from "react";
import "./ProfileEdit.css";
// import { useLocation } from "react-router-dom";
import { IoPersonCircleOutline } from "react-icons/io5";
import Button from "./Button";
import Spinner from "./Spinner";
import useUpdateAffiliate from "../hooks/useUpdateAffiliate";
import axios from "axios";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";

type EditableProfile = {
  name?: string;
  email?: string;
  avatar?: string;
};

export default function ProfileEdit() {
      const [editing, setEditing] = useState(false);
      const [profile, setProfile] = useState<EditableProfile | null>(null);
      const [tempProfile, setTempProfile] = useState<EditableProfile | null>(null);

    //   const location = useLocation();
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

  return (
    <div className="modern-profile-card">
      {/* <h3>Edit Profile</h3> */}
      <br />
      <div className="col- 12 avatar-section">
        {tempProfile?.avatar ? (
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
        <div className="row g-0 field-group">
          <label>Name</label>
          {editing ? (
            <input
              name="name"
              value={tempProfile?.name || ""}
              onChange={handleChange}
              className="input"
            />
          ) : (
            <p>{profile?.name || "N/A"}</p>
          )}
        </div>
        <div className="label-underline" />

        <div className="field-group">
          <label>Email</label>
          {editing ? (
            <input
              name="email"
              value={tempProfile?.email}
              onChange={handleChange}
              className="input"
            />
          ) : (
            <p>{profile?.email}</p>
          )}
        </div>
        <div className="label-underline" />

        <div className="field-group">
          <label>Role</label>
          <p>{me.role}</p>
        </div>
        <div className="label-underline" />

        {updateError && <p className="error">Failed to save changes.</p>}
        {editing ? (
          <div className="btn-row">
            <Button className="blue-btn" onClick={saveChanges} type="button">
              {updating ? <Spinner /> : <span>Save</span>}
            </Button>
            <Button className="orange-btn" onClick={cancelEdit} type="button">
              Cancel
            </Button>
          </div>
        ) : (
          <div className="btn-row">
            <Button
              className="blue-btn"
              onClick={() => setEditing(true)}
              type="button"
            >
              Edit Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
