import styles from "../styles.less";
import React, { useEffect, useRef } from "react";
import { Box, Spinner } from "@gandi-ide/gandi-ui";
import hack from "../hack";

interface ArticleProps {
  name: string;
  Jump: string;
}

const Article: React.FC<ArticleProps> = ({ name, Jump }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setloading] = React.useState(true);

  React.useEffect(() => {
    hack.setLoad(setloading);
    if (iframeRef.current) {
      iframeRef.current.onload = () => {
        hack.bluePrint = [];
        hack.article = [];
        hack.demo = [];
        // 在这里执行你的加载完成后的逻辑
        setTimeout(() => {
          setTimeout(() => {
            if (window.location.search.indexOf("Block") !== -1) {
              iframeRef.current.contentWindow.postMessage(["loadBlock"], "*");
            }
          }, 2000);
          setloading(false);
        }, 100);
      };
    }
  }, []);

  return (
    <div className={styles.window}>
      {loading && (
        <div className={styles.windows}>
          <Spinner id={"gandi-solution-loading"} className={styles.loading} />
        </div>
      )}
      <iframe
        allow="clipboard-write"
        id="gandi-solution-article-iframe"
        ref={iframeRef}
        className={styles.inner}
        src={name + "?hideHeader" + (Jump ? "&JumpLink=" + Jump : "")}
        title="教程文章"
        width="100%"
        height="500px"
      />
    </div>
  );
};

export default Article;
