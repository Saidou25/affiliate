import "./LogoutConfirmation.css";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export default function LogoutConfirmation({ onConfirm, onCancel }: Props) {
  return (
    <div className="logout-confirmation">
      <p className="logout-message">Are you sure you want to log out?</p>
      <div className="logout-actions">
        <button className="btn cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn confirm-btn" onClick={onConfirm}>
          Yes, Logout
        </button>
      </div>
    </div>
  );
}
