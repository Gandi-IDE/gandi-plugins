import styles from "../styles.less";
import React from "react";
import Demo from "./Demo";

interface BluePrintListProps {
  list: Array<{ url: string; block: string }>;
  msg: (key: string) => string;
}

const BluePrintList: React.FC<BluePrintListProps> = ({ list, msg }) => {
  return (
    <div className={styles.window}>
      {list.length === 0 ? (
        <p className={styles.p}>{msg("plugins.blockSharing.noDemo")}</p>
      ) : (
        list.map((item, index) => <Demo key={index} content={item} />)
      )}
    </div>
  );
};

export default BluePrintList;
