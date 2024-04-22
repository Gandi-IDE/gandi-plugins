import * as React from "react";
import classNames from "classnames";
import RightIcon from "assets/icon--down.svg";
import styles from "./styles.less";

export interface TargetItemViewProps {
  collapsible?: boolean;
  name?: string;
  variables: {
    variables?: string[];
    lists?: string[];
  };
}

const CollapsibleItemView: React.FC<{
  collapsed: boolean;
  name: string;
  onClick: () => void;
}> = ({ name, collapsed, onClick }) => (
  <li className={classNames(styles.row, collapsed && styles.collapsed)} onClick={onClick}>
    <span className={styles.collapseIcon}>
      <RightIcon />
    </span>
    <span>{name}</span>
  </li>
);

export default CollapsibleItemView;
