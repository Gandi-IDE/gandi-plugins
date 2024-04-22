import * as React from "react";
import { defineMessages } from "react-intl";
import { useDevToolsContext } from "src/plugins/dev-tools/lib/context";
import { devToolsObserver } from "src/plugins/dev-tools/lib/dev-tools-observer";
import { enableLegendStateReact, observer } from "@legendapp/state/react";
import { DraggableData } from "react-draggable";
import TackedVariableView from "../TackedVariableView";

import styles from "./styles.less";

enableLegendStateReact();

const messages = defineMessages({
  tackedVariablesEmpty: {
    id: "plugins.devTools.tackedVariablesEmpty",
    defaultMessage: "No monitoring variable added.",
    description: "No monitoring variable added. \n Click the 'pin' button in front of the variable to monitor it.",
  },
});

const TackedVariables: React.FC = observer(() => {
  const { intl } = useDevToolsContext();
  const [variableIdList, setVariableIdList] = React.useState([]);
  const variableIdListRef = React.useRef(variableIdList);

  const handleDrag = React.useCallback(
    (index: number, ui: DraggableData) => {
      const draggedItem = variableIdListRef.current[index];
      const newList = [...variableIdListRef.current];
      newList.splice(Number(index), 1);
      newList.splice(ui.y / 24 + index, 0, draggedItem);
      devToolsObserver.tackedVariables.set(
        newList.reduce(
          (acc, v, index) => ({
            ...acc,
            [v.key]: {
              ...v,
              index,
            },
          }),
          {},
        ),
      );
    },
    [variableIdList],
  );

  const handleTackedVariables = React.useCallback(() => {
    const tackedVariables = devToolsObserver.tackedVariables.peek();
    const newList = Object.keys(tackedVariables).map((key) => ({
      key,
      ...tackedVariables[key],
    }));
    newList.sort((a, b) => a.index - b.index);
    setVariableIdList(newList);
  }, []);

  React.useEffect(() => {
    handleTackedVariables();
    const dispose = devToolsObserver.tackedVariables.onChange(() => {
      handleTackedVariables();
    });
    return () => {
      dispose();
    };
  }, []);

  React.useEffect(() => {
    variableIdListRef.current = [...variableIdList];
  }, [variableIdList]);

  return (
    <ul className={styles.container}>
      {variableIdList.map((item, index) => (
        <TackedVariableView key={item.variableId} {...item} index={index} handleDrag={handleDrag} />
      ))}
      {!variableIdList.length && (
        <li className={styles.tackedVariablesEmpty}>{intl.formatMessage(messages.tackedVariablesEmpty)}</li>
      )}
    </ul>
  );
});

TackedVariables.displayName = "TackedVariables";

export default TackedVariables;
