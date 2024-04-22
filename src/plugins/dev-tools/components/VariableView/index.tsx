import * as React from "react";
import classNames from "classnames";
import Bubble from "components/Bubble";
import IF from "components/IF";
import { defineMessages } from "react-intl";
import ListView from "../ListView";
import TackIcon from "assets/icon--tack.svg";
import TackedIcon from "assets/icon--tacked.svg";
import RightIcon from "assets/icon--down.svg";
import DraggableIcon from "assets/icon--draggable.svg";
import CloneIcon from "assets/icon--clones.svg";

import { ListVariable, devToolsObserver, variableChangeEventBus } from "../../lib/dev-tools-observer";
import { useDevToolsContext } from "src/plugins/dev-tools/lib/context";
import { Computed, enableLegendStateReact } from "@legendapp/state/react";
import { VariableChangeEventDetail } from "src/plugins/dev-tools/lib/proxy-variable";
import styles from "./styles.less";

export interface VariableItemViewProps {
  indent?: boolean;
  doubleIndent?: boolean;
  draggableIconClassName?: string;
  fixedTargetName?: boolean;
  index: number;
  renderTargetId: string;
  renderTargetName: string;
  showTargetName?: boolean;
  showClones?: boolean;
  trackable?: boolean;
  variableId: string;
  variableName: string;
  variableValue: string | ListVariable;
  onClickShowClones?: () => void;
}

const messages = defineMessages({
  clone: {
    id: "plugins.devTools.clone",
    defaultMessage: "Clone",
    description: "Clone role",
  },
});

enableLegendStateReact();

const VariableItemView = React.forwardRef<HTMLLIElement, VariableItemViewProps>(
  (
    {
      doubleIndent,
      draggableIconClassName,
      index,
      variableId,
      variableName,
      showTargetName,
      showClones,
      variableValue,
      indent = true,
      renderTargetId,
      renderTargetName,
      fixedTargetName,
      trackable = true,
      onClickShowClones,
    },
    ref,
  ) => {
    const { intl } = useDevToolsContext();
    const [value, setValue] = React.useState(variableValue);
    const [name, setName] = React.useState(variableName);
    const [collapsed, setCollapsed] = React.useState(true);
    const isList = value instanceof Array;

    const handleClick = () => {
      setCollapsed((value) => !value);
    };

    const handleTack = (e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `${renderTargetId}${variableId}`;
      if (devToolsObserver.tackedVariables[key].peek()) {
        devToolsObserver.tackedVariables[key].delete();
      } else {
        devToolsObserver.tackedVariables.assign({
          [key]: {
            index: Date.now(),
            variableId,
            variableName: name,
            variableValue: value,
            renderTargetId,
            renderTargetName,
          },
        });
      }
    };

    React.useEffect(() => {
      const eventName = `${renderTargetId}${variableId}`;
      const handleVariableChange = (variable: VariableChangeEventDetail) => {
        const { propertyName, value: newValue } = variable;
        if (propertyName === "name") {
          setName(newValue as string);
        } else if (propertyName === "value") {
          setValue(newValue);
        }
      };
      variableChangeEventBus.on(eventName, handleVariableChange);
      return () => {
        variableChangeEventBus.detach(eventName, handleVariableChange);
      };
    }, []);

    return (
      <>
        <li
          ref={ref}
          data-index={index}
          className={classNames(
            styles.row,
            indent && styles.indent,
            doubleIndent && styles.doubleIndent,
            isList && styles.clickable,
            collapsed && styles.collapsed,
          )}
          onClick={handleClick}
        >
          <IF forceRender condition={trackable}>
            <div className={classNames(styles.tackIcon, styles.icon)} onClick={handleTack}>
              <Computed>
                {() =>
                  devToolsObserver.tackedVariables[`${renderTargetId}${variableId}`].get() ? (
                    <TackedIcon />
                  ) : (
                    <TackIcon />
                  )
                }
              </Computed>
            </div>
          </IF>
          <IF forceRender condition={isList}>
            <span className={styles.collapseIcon}>
              <RightIcon />
            </span>
          </IF>
          <IF condition={showTargetName}>
            {fixedTargetName ? (
              <span>{renderTargetName}:&nbsp;</span>
            ) : (
              <Computed>
                {() => (
                  <span>
                    {devToolsObserver.targetAndNameMap[renderTargetId].get()}
                    :&nbsp;
                  </span>
                )}
              </Computed>
            )}
          </IF>
          <span
            className={classNames(styles.variableName, styles.ellipsis)}
            style={{
              color: isList ? "#EA692F" : "#EF9A4F",
            }}
          >
            {name}
            {isList ? "" : ":"}
          </span>
          {!isList && (
            <Bubble title={value}>
              <span className={classNames(styles.ellipsis, styles.variableValue)}>{value}</span>
            </Bubble>
          )}
          <div className={styles.iconList}>
            <IF forceRender condition={!!onClickShowClones}>
              <Bubble title={intl.formatMessage(messages.clone)}>
                <span
                  className={classNames(styles.icon)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClickShowClones();
                  }}
                >
                  <CloneIcon />
                </span>
              </Bubble>
            </IF>
            <IF forceRender condition={!!draggableIconClassName}>
              <span
                className={classNames(styles.icon, draggableIconClassName)}
                style={{ cursor: showClones ? "" : "grab" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DraggableIcon />
              </span>
            </IF>
          </div>
        </li>
        <IF forceRender condition={isList && !collapsed}>
          <ListView value={value as ListVariable} />
        </IF>
      </>
    );
  },
);

VariableItemView.displayName = "VariableItemView";

export default VariableItemView;
