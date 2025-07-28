import "./Spinner.css";

type Props = {
  message?: string;
};
export default function Spinner({ message }: Props) {

  if (message === "full-page") {
    return (
      <div
        className="spinner-grow"
        style={{ width: "3rem", height: "3rem" }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }
  return (
    <div className="spinner-container">
      <div className="spinner" />
    </div>
  );
}
