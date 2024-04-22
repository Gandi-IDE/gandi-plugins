import * as React from "react";
import Draggable, { DraggableData } from "react-draggable";
import { useDevToolsContext } from "src/plugins/dev-tools/lib/context";
import { defineMessages } from "react-intl";
import IF from "components/IF";
import VariableItemView from "../VariableView";
import { devToolsObserver, ListVariable } from "src/plugins/dev-tools/lib/dev-tools-observer";
import styles from "./styles.less";

export interface TackedVariableViewProps {
  index?: number;
  variableId: string;
  variableName: string;
  variableValue: string | ListVariable;
  renderTargetId: string;
  handleDrag(index: number, ui: DraggableData): void;
}

const messages = defineMessages({
  clone: {
    id: "plugins.devTools.clone",
    defaultMessage: "Clone",
    description: "Clone role",
  },
});

const TackedVariableView: React.FC<TackedVariableViewProps> = ({
  index,
  variableId,
  variableName,
  variableValue,
  renderTargetId,
  handleDrag,
}) => {
  const { intl, vm } = useDevToolsContext();

  const target = vm.runtime.targets.find((t) => t.id === renderTargetId);
  const [clones, setClones] = React.useState<string[]>([]);
  const [showClones, setShowClones] = React.useState(false);

  const cloneTargetName = React.useCallback(
    (index: number, cloneString: string) => `${intl.formatMessage(messages.clone)} ${index} (${cloneString})`,
    [intl],
  );

  const cloneTargetValue = React.useCallback(
    (index: number) => {
      const clone = target.sprite.clones[index + 1];
      if (clone) {
        return clone.variables[variableId]?.value;
      }
    },
    [intl],
  );

  const handleShowClones = React.useCallback(() => {
    setShowClones((tag) => !tag);
  }, []);

  const handleStopDrag = React.useCallback(
    (e: unknown, data: DraggableData) => {
      handleDrag(index, data);
    },
    [handleDrag],
  );

  React.useEffect(() => {
    if (!target) return;
    const createClone = target.sprite.createClone.bind(target.sprite);
    const removeClone = target.sprite.removeClone.bind(target.sprite);

    // 处理新增克隆体的情况
    const superCreateClone = function (optLayerGroup: string) {
      const newCLone = createClone(optLayerGroup);
      setTimeout(() => {
        setClones((prev) => [...prev, newCLone.id]);
      }, 100);
      return newCLone;
    };
    // 处理删除克隆体的情况
    const superRemoveClone = function (clone: Scratch.RenderTarget) {
      removeClone(clone);
      setClones((prev) => prev.filter((c) => c !== clone.id));
    };

    target.sprite.createClone = superCreateClone.bind(target.sprite);
    target.sprite.removeClone = superRemoveClone.bind(target.sprite);
    return () => {
      target.sprite.createClone = createClone;
      target.sprite.removeClone = removeClone;
    };
  }, [vm, target]);

  React.useEffect(() => {
    if (target) {
      setClones(target.sprite.clones.slice(1).map((clone) => clone.id));
    }
  }, [target]);

  // 角色不存在时不展示UI
  return target ? (
    <Draggable
      axis="y"
      disabled={showClones}
      position={{ x: 0, y: 0 }}
      bounds="parent"
      handle={"." + styles.draggableIcon}
      onStop={handleStopDrag}
    >
      <div data-index={index} className={styles.row}>
        <VariableItemView
          draggableIconClassName={styles.draggableIcon}
          index={index}
          indent={false}
          renderTargetId={target.id}
          renderTargetName={devToolsObserver.targetAndNameMap[target.id].get()}
          showTargetName
          showClones={showClones}
          variableName={variableName}
          variableId={variableId}
          variableValue={variableValue}
          onClickShowClones={clones.length ? handleShowClones : null}
        />
        <IF forceRender condition={showClones}>
          <ul className={styles.cloneList}>
            {clones.map((clone, index) => (
              <VariableItemView
                key={clone}
                indent={false}
                doubleIndent
                index={index}
                fixedTargetName
                showTargetName
                renderTargetId={clone}
                renderTargetName={cloneTargetName(index, clone)}
                variableName={variableName}
                variableId={variableId}
                variableValue={cloneTargetValue(index)}
                trackable={false}
              />
            ))}
          </ul>
        </IF>
      </div>
    </Draggable>
  ) : null;
};

TackedVariableView.displayName = "TackedVariableView";

const areEqual = (prevProps: TackedVariableViewProps, nextProps: TackedVariableViewProps) =>
  prevProps.variableId === nextProps.variableId && prevProps.index === nextProps.index;

export default React.memo(TackedVariableView, areEqual);
