import styles from "../styles.less";
import React, { useEffect, useRef } from "react";
import hack from "../hack";
import classNames from "classnames";

interface ArticleProps {
  content: { url: string; block: string };
}

const Article: React.FC<ArticleProps> = ({ content }) => {
  return (
    <div className={styles.imgCard}>
      <a className={classNames(styles.inner, styles.url)} href={content.url} target="_blank" rel="noopener noreferrer">
        {content.block ? content.block : content.url}
      </a>
    </div>
  );
};

export default Article;
