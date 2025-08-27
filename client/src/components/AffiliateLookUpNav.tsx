import { ReactElement, useState } from "react";

import "./AffiliateLookUpNav.css";
// import ProfileLookUp from "./ProfileLookUp";
// import NotificationForm from "./NotificationForm";

type Props = {
    children: ReactElement[]; 
};

const tabLabels = ["Profile", "Send a Notification", "Send email", "Manage Commission Rates"];

export default function AffiliateLookUpNav({ children }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="tabbed-nav">
      <nav className="tab-buttons">
       {tabLabels.map((label, index) => (
          <button
            key={index}
            className={`tab-button ${index === activeIndex ? "active" : ""}`}
            onClick={() => setActiveIndex(index)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="tab-content fade-in">
        {children[activeIndex]}  {/* Renders tabLables'components */}
      </div>
    </div>
  );
}



