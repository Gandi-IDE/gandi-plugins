import styles from "../styles.less";
import React from "react";
import Article from "./Article";

interface ArticleListProps {
  list: Array<{ url: string; block: string }>;
  msg: (key: string) => string;
}

const ArticleList: React.FC<ArticleListProps> = ({ list, msg }) => {
  return (
    <div className={styles.window}>
      {list.length === 0 ? (
        <p className={styles.p}>{msg("plugins.blockSharing.noArticle")}</p>
      ) : (
        list.map((item, index) => <Article key={index} content={item} />)
      )}
    </div>
  );
};

export default ArticleList;
