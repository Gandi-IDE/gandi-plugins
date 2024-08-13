import styles from "../styles.less";
import React, { useRef } from "react";
import { Spinner } from "@gandi-ide/gandi-ui";
import classNames from "classnames";

interface BluePrintProps {
  content: {
    url: string;
    block: string;
    detail?: { creationRelease: { coverGifLink: number; coverLink: number }; description: string; type: Array<string> };
  };
}

const BluePrint: React.FC<BluePrintProps> = ({ content }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loading, setLoading] = React.useState(true);
  const load = () => {
    setLoading(false);
  };

  const handleClick = () => {
    window.open(`${content.url}?remixing=true`, "_blank");
  };

  return (
    <div className={styles.imgCard}>
      {loading && (
        <div className={styles.imgCardLoad}>
          <Spinner id={"block-sharing-loading"} className={styles.loading} />
        </div>
      )}
      <img
        className={classNames(styles.inner, styles.url)}
        ref={imgRef}
        src={String(
          content.detail.creationRelease.coverGifLink
            ? content.detail.creationRelease.coverGifLink
            : content.detail.creationRelease.coverLink,
        )}
        alt={content.detail.description}
        width="100%"
        height="500px"
        onLoad={load}
        onClick={handleClick}
      />
    </div>
  );
};

export default BluePrint;
