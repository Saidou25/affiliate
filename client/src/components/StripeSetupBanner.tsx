// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { IoMdClose } from "react-icons/io";
// import Button from "./Button";
// import { AffiliateOutletContext } from "./AffiliateDashboard";

// import "./StripeSetupBanner.css";

// // Reuse the exact shape from the outlet:
// type OnboardingForBanner = AffiliateOutletContext["onboardingStatus"];

// export default function StripeSetupBanner({
//   onboardingStatus,
// }: {
//   onboardingStatus: OnboardingForBanner;
// }) {
//   const [visible, setVisible] = useState(true);
//   const [sticky, setSticky] = useState<OnboardingForBanner | null>(null);
//   const navigate = useNavigate();

//   // Capture the last non-loading status
//   useEffect(() => {
//     if (!onboardingStatus?.loading) {
//       setSticky(onboardingStatus);
//     }
//   }, [onboardingStatus]);

//     if (!visible || (onboardingStatus?.loading && !sticky)) return null;

//   // Prefer last stable value during brief loading
//   const shown = sticky ?? onboardingStatus;

//   // if (!visible || !shown?.onboardingStatusMessage) {
//   //   return null;
//   // }
//   if (!shown?.onboardingStatusMessage) return null;

//   return (
//     <>
//       {sticky ? (
//         <div className="stripe-banner-div ">
//           <div className="title-close-div">
//             <h2>Stripe Payment Setup</h2>
//             <IoMdClose
//               className="stripe-close"
//               onClick={() => setVisible(false)}
//               aria-label="Close"
//             />
//           </div>
//           <div className="stripe-banner">
//             <p className="stripe-text">
//               {shown.onboardingStatusMessage}
//             </p>
//             <div className="stripe-actions">
//               {shown?.state === "complete" ? (
//                 <Button className="blue-btn-settings danger-btn"
//                  onClick={() => navigate("settings")}>
//                   {shown.onboardingDangerButtonMessage ||
//                     "Manage Stripe"}
//                 </Button>
//               ) : (
//                 <Button
//                   className="blue-btn"
//                   onClick={() => navigate("settings")}
//                 >
//                   {shown.onboardingStatusButtonMessage ||
//                     "Manage Stripe"}
//                 </Button>
//               )}
//             </div>
//           </div>
//         </div>
//       ) : null}
//     </>
//   );
// }
