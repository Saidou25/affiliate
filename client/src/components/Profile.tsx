// import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useEffect, useRef, useState } from "react";
import { IoPersonCircleOutline } from "react-icons/io5";
import axios from "axios";
import Spinner from "./Spinner";
import useUpdateAffiliate from "../hooks/useUpdateAffiliate";
import Button from "./Button";

import "./Profile.css";

type EditableProfile = {
  name?: string;
  email?: string;
  avatar?: string;
};

export default function Profile() {
  const [settings, setSettings] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [tempProfile, setTempProfile] = useState<EditableProfile | null>(null);
  const [editRow, setEditRow] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  const { update, updating, updateError } = useUpdateAffiliate();

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formatDate = (input: string | number | Date) => {
    const d = new Date(input);
    if (isNaN(d.getTime())) return ""; // invalid date guard
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/New_York",
    }).format(d);
  };

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

  if (!me || !profile || !tempProfile) return <p>Loading...</p>;

  if (settings) {
    return (
      <>
        <div className="row avatar-row g-0">
          <div className="col-9 avatar-section">
            {tempProfile.avatar ? (
              <img
                src={tempProfile.avatar}
                alt="Avatar"
                className="avatar-img"
              />
            ) : (
              <IoPersonCircleOutline className="avatar-img" />
            )}
          </div>
          <div className="col-3 btn-row">
            {editRow !== "avatar" && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleAvatarChange(e), setEditRow("avatar");
                  }}
                  ref={fileInputRef}
                  className="hidden-input"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="blue-btn-image-setting"
                  type="button"
                >
                  Edit
                </Button>
              </>
            )}

            {editRow === "avatar" && (
              <>
                <input
                  className="col-3 hidden-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  ref={fileInputRef}
                />
                <div className="col-3 btn-row">
                  <Button
                    onClick={saveChanges}
                    className="blue-btn-image-setting"
                    type="button"
                  >
                    Save
                  </Button>
                  <Button
                    className="orange-btn-image-setting"
                    onClick={() => {
                      cancelEdit(), setEditRow("");
                    }}
                    type="button"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
        <br />

        {me.name && (
            <div className="row row-profile-settings g-0">
              <div className="col-9">
                <strong>Name - </strong>
                <span className="">{me.name}</span>
              </div>
              <div className="col-3 btn-row">
                {editRow !== "name" && (
                  // <div className="col-3 btn-row">
                  <Button
                    className="blue-btn-image-setting"
                    onClick={() => setEditRow("name")}
                    type="button"
                  >
                    Edit
                  </Button>
                )}
              </div>

              {editRow === "name" && (
                <div className="row g-0">
                  <input
                    name="name"
                    value={tempProfile.name || ""}
                    onChange={handleChange}
                    className="col-9 input"
                  />
                  <div className="col-3 btn-row">
                    <Button
                      className="blue-btn-image-setting"
                      onClick={saveChanges}
                      type="button"
                    >
                      {updating ? <Spinner /> : <span>Save</span>}
                    </Button>
                    <Button
                      className="orange-btn-image-setting"
                      onClick={() => {
                        cancelEdit(), setEditRow("");
                      }}
                      type="button"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
        )}
      
        <br />

        {me.email && (
          <div className="row row-profile-settings g-0">
            <div className="col-9">
              <strong>Contact Email - </strong>
              {me.email}
            </div>
            <div className="col-3 btn-row">
              {editRow !== "email" && (
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
              <div className="row g-0">
                <input
                  name="email"
                  value={tempProfile.email || ""}
                  onChange={handleChange}
                  className="col-9 input"
                />
                <div className="col-3 btn-row">
                  <Button
                    className="blue-btn-image-setting"
                    onClick={saveChanges}
                    type="button"
                  >
                    {updating ? <Spinner /> : <span>Save</span>}
                  </Button>
                  <Button
                    className="orange-btn-image-setting"
                    onClick={() => {
                      cancelEdit(), setEditRow("");
                    }}
                    type="button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <br />
      
        {me.phone && (
          <>
            <strong>Contact Phone Number - </strong>
            {me.phone}
            <br />
            <br />
          </>
        )}
        {me.refId && (
          <>
            <strong>Reference id - </strong>
            {me.refId}
            <br />
            <br />
          </>
        )}
        {me.commissionRate && (
          <>
            <strong>Commission Rate - </strong>
            {me.commissionRate * 100}%
            <br />
            <br />
          </>
        )}
        {me.stripeAccountId && (
          <>
            <strong>Stripe Account Id - </strong>
            {me.stripeAccountId}
            <br />
            <br />
          </>
        )}
        {me.createdAt && (
          <>
            <strong>Affiliate since - </strong>
            {formatDate(me.createdAt)}
            <br />
            <br />
          </>
        )}
        {/* <div className="settings-actions">
          <Button
            onClick={() => {
              // navigate("/affiliate/profile");
              setEditing((prev) => !prev);
              // setSettings((prev) => !prev);
            }}
            className="blue-btn-profile"
          >
            Edit Profile
          </Button>
        </div> */}
      </>
    );
  }

  {
    /* // return (
  //   <div className="modern-profile-card">
  //     {/* <h3>Edit Profile</h3> */
  }
  {
    /* //     <br /> */
  }
  {
    /* //     <div className="col- 12 avatar-section"> */
  }
  {
    /* //       {tempProfile.avatar ? ( */
  }
  //         <img
  //           src={tempProfile.avatar}
  //           alt="Avatar"
  //           className="avatar-img me-3"
  //         />
  //       ) : (
  //         <IoPersonCircleOutline className="avatar-img me-3" />
  //       )}

  // {editing && (
  //         <>
  // <input
  //   type="file"
  //   accept="image/*"
  //   onChange={handleAvatarChange}
  //   ref={fileInputRef}
  //   className="hidden-input"
  // />
  // <Button
  //   onClick={() => fileInputRef.current?.click()}
  //   className="blue-btn"
  //   type="button"
  // >
  //   Change Photo
  // </Button>
  //         </>
  //       )}
  //     </div>

  //     <div className="profile-info">
  //       <div className="row field-group">
  //         <label>Name</label>
  //         {editing ? (
  //           <input
  //             name="name"
  //             value={tempProfile.name || ""}
  //             onChange={handleChange}
  //             className="input"
  //           />
  //         ) : (
  //           <p>{profile.name || "N/A"}</p>
  //         )}
  //       </div>
  //       <div className="label-underline" />

  //       <div className="field-group">
  //         <label>Email</label>
  //         {editing ? (
  //           <input
  //             name="email"
  //             value={tempProfile.email}
  //             onChange={handleChange}
  //             className="input"
  //           />
  //         ) : (
  //           <p>{profile.email}</p>
  //         )}
  //       </div>
  //       <div className="label-underline" />

  //       <div className="field-group">
  //         <label>Role</label>
  //         <p>{me.role}</p>
  //       </div>
  //       <div className="label-underline" />

  //       {updateError && <p className="error">Failed to save changes.</p>}
  //       {editing ? (
  //         <div className="btn-row">
  //           <Button className="blue-btn" onClick={saveChanges} type="button">
  //             {updating ? <Spinner /> : <span>Save</span>}
  //           </Button>
  //           <Button className="orange-btn" onClick={cancelEdit} type="button">
  //             Cancel
  //           </Button>
  //         </div>
  //       ) : (
  //         <div className="btn-row">
  //           <Button
  //             className="blue-btn"
  //             onClick={() => setEditing(true)}
  //             type="button"
  //           >
  //             Edit Profile
  //           </Button>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );
}
