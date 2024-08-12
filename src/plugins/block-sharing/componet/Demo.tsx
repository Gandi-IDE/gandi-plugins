import styles from "../styles.less";
import React, { useEffect, useRef } from "react";
import { Spinner } from "@gandi-ide/gandi-ui";
import hack from "../hack";
import classNames from "classnames";

interface BluePrintProps {
  content: { url: string; block: string; detail?: any | undefined };
}

const BluePrint: React.FC<BluePrintProps> = ({ content }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loading, setloading] = React.useState(true);
  const [hack, setHack] = React.useState(false);

  //用effect与ref注册拖拽图片的事件，使用state防止多次注册
  useEffect(() => {
    if (!hack) {
      setHack(true);
      if (imgRef.current) {
        imgRef.current.addEventListener("dragstart", (e) => {
          window.postMessage(["startDrop", String(content.url)], "*");
          imgRef.current?.addEventListener(
            "dragend",
            (e) => {
              window.postMessage(["cancelDrop", [e.clientX, e.clientY]], "*");
            },
            { once: true },
          );
        });
      }
    }
  }, [content, hack]);

  const load = () => {
    setloading(false);
  };

  const handleClick = () => {
    window.open(`${content.url}?remixing=true`, "_blank");
  };

  return (
    <div className={styles.imgCard}>
      {loading && (
        <div className={styles.imgCardLoad}>
          <Spinner id={"gandi-solution-loading"} className={styles.loading} />
        </div>
      )}
      <img
        className={classNames(styles.inner, styles.url)}
        ref={imgRef}
        src={
          content.detail.creationRelease.coverGifLink
            ? content.detail.creationRelease.coverGifLink
            : content.detail.creationRelease.coverLink
        }
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
