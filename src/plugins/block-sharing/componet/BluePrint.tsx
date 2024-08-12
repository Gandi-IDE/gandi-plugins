import styles from "../styles.less";
import React, { useEffect, useRef } from "react";
import { Spinner } from "@gandi-ide/gandi-ui";
import hack from "../hack";
import classNames from "classnames";

interface BluePrintProps {
  content: { url: string; block: string; detail?: any };
  msg: (key: string) => string;
}

const BluePrint: React.FC<BluePrintProps> = ({ content, msg }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loading, setloading] = React.useState(true);
  const [hack, setHack] = React.useState(false);

  //用effect与ref注册拖拽图片的事件，使用state防止多次注册
  useEffect(() => {
    if (!hack) {
      setHack(true);
      if (imgRef.current) {
        imgRef.current.addEventListener("dragstart", (e) => {
          if (content.detail && content.detail.type) {
            window.postMessage(["startDrop", content.detail], "*");
          } else {
            window.postMessage(["startDrop", String(content.url)], "*");
          }

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

  return (
    <div className={styles.imgCard}>
      {loading && (
        <div className={styles.imgCardLoad}>
          <Spinner id={"gandi-solution-loading"} className={styles.loading} />
        </div>
      )}
      <img
        className={classNames(styles.inner, styles.block)}
        ref={imgRef}
        src={content.url}
        alt={msg("plugins.blockSharing.bluePrint")}
        width="100%"
        height="500px"
        onLoad={load}
      />
    </div>
  );
};

export default BluePrint;
