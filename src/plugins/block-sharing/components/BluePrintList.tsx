import styles from "../styles.less";
import React from "react";
import BluePrint from "./BluePrint";

interface BluePrintListProps {
  list: Array<{ url: string; block: string }>;
  msg: (key: string) => string;
}

const BluePrintList: React.FC<BluePrintListProps> = ({ list, msg }) => {
  return (
    <div className={styles.window}>
      {list.length === 0 ? (
        <p className={styles.p}>{msg("plugins.blockSharing.noBluePrint")}</p>
      ) : (
        list.map((item, index) => <BluePrint key={index} content={item} msg={msg} />)
      )}
    </div>
  );
};

export default BluePrintList;
