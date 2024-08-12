import styles from "../styles.less";
import React, { useEffect, useRef } from "react";
import { Spinner } from "@gandi-ide/gandi-ui";
import hack from "../hack";
import Article from "./Article";

interface ArticleListProps {
  list: Array<{ url: string; block: string }>;
  msg: (key: string) => string;
}

const ArticleList: React.FC<ArticleListProps> = ({ list, msg }) => {
  return (
    <div className={styles.window}>
      {list.length === 0 ? (
        <p className={styles.p}>{msg("plugins.gandiSolution.noArticle")}</p>
      ) : (
        list.map((item, index) => <Article key={index} content={item} />)
      )}
    </div>
  );
};

export default ArticleList;
