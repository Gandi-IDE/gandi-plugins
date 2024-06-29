import * as React from "react";
import classNames from "classnames";
import styles from "./styles.less";

interface SwitchProps {
  className?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({ className, checked, onChange }) => {
  const handleClick = () => {
    onChange(!checked);
  };

  return (
    <div
      className={classNames(styles.switch, className, {
        [styles.checked]: checked,
      })}
      onClick={handleClick}
    >
      <span className={styles.handler} />
    </div>
  );
};

export default React.memo(Switch);
