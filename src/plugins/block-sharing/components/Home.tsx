import styles from "../styles.less";
import React, { useRef } from "react";
import { Spinner } from "@gandi-ide/gandi-ui";
import hack from "../hack";

interface ArticleProps {
  name: string;
  Jump: string;
}

const Article: React.FC<ArticleProps> = ({ name, Jump }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    hack.setLoad(setLoading);
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
          setLoading(false);
        }, 100);
      };
    }
  }, []);

  return (
    <div className={styles.window}>
      {loading && (
        <div className={styles.windows}>
          <Spinner id={"block-sharing-loading"} className={styles.loading} />
        </div>
      )}
      <iframe
        allow="clipboard-write"
        id="block-sharing-article-iframe"
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
