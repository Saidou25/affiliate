import Button from "./Button";
import Spinner from "./Spinner";
import { FaCheckCircle } from "react-icons/fa";

import "./ConfirmCloseConnectionModal.css";
// import { createPortal } from "react-dom";

type Props = {
  setShowModal: (item: boolean) => void;
  closeConnection: () => void;
  closeConnectionMessage: string;
  loading: boolean;
  setStripeMessage: (item: string) => void;
};
// function ModalContent({
export default function ConfirmCloseConnectionModal({
  setShowModal,
  closeConnection,
  loading,
  closeConnectionMessage,
}: //   setStripeMessage,
Props) {
  //   const [loadingI, setLoadingI] = useState(false);

  //   useEffect(() => {
  //     if (loadingI) {
  //       setTimeout(() => {
  //         setLoadingI(false);
  //         setStripeMessage("Stripe account successfully disconnected.");
  //       }, 3000);
  //     }
  //   }, [loadingI]);

  if (loading)
    return (
      <div className="end-connection-overlay">
        <Spinner message="full-page" />
      </div>
    );

  if (closeConnectionMessage) {
    return (
      <div className="end-connection-overlay">
        <div className="end-div-container">
          <div className="fa-div">
            <FaCheckCircle className="fa-icon" />
          </div>
          <br />
          <h2 className="end-div-success">
            Stripe account successfully disconnected...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="end-connection-overlay">
      <div className="end-container">
        <h2 className="end-div">
          Please confirm you want to close your connection
        </h2>
        <p className="end-text">
          Disconnecting your account is permanent and will stop all future
          payouts.
        </p>
        <div className="btn-div">
          <Button
            className="blue-btn"
            // onClick={() => setLoadingI(true)}
            //   onClick={() => setStripeMessage("Stripe account successfully disconnected.")}
            onClick={closeConnection}
          >
            Confirm
          </Button>
          <Button className="orange-btn" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
// export default function ConfirmCloseConnectionModal(props: Props) {
//   // Render at the document body level to avoid clipping by parents
//   return createPortal(<ModalContent {...props} />, document.body);
// }
