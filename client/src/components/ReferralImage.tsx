import { ReactNode } from "react";

import "./ReferralImage.css";
type Props = {
  children: ReactNode;
  imageUrl: string;
};
export default function ReferralImage({ children, imageUrl }: Props) {
  return (
    <div>
      <strong className="image-link-title">Item image:</strong>
      <br />
      <div className="image-link">
        <strong>Copy and paste:&nbsp;</strong>
        <span className="d-none d-sm-inline">
          right-click the image and choose <em>Save image as…</em> or{" "}
          <em>Copy image</em>.
        </span>
        <span className="d-inline d-sm-none">
          long-press the image and choose <em>Save</em> or <em>Copy</em>.
        </span>
        <br />
        <i className="or">- or -</i>
        <div className="url-and-clip">
          <div>
            <strong>Use url directly:&nbsp;</strong>
            <span className="product-link__url">{imageUrl}</span>
          </div>
        {children}
        </div>
      </div>
    </div>
  );
}
