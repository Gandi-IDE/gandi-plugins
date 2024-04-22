import * as React from "react";
import { defineMessages } from "@formatjs/intl";
import { useDevToolsContext } from "src/plugins/dev-tools/lib/context";
import { detailedDiff } from "deep-object-diff";
import { VariableItemViewProps } from "../VariableView";
import TargetView from "../TargetView";
import styles from "./styles.less";
import { devToolsObserver } from "src/plugins/dev-tools/lib/dev-tools-observer";

const messages = defineMessages({
  stage: {
    id: "plugins.common.stage",
    defaultMessage: "Stage",
    description: "Label for the stage in the stage selector",
  },
  globalVariables: {
    id: "plugins.devTools.globalVariables",
    defaultMessage: "Global Variables",
    description: "Show all global variables",
  },
  privateVariables: {
    id: "plugins.devTools.privateVariables",
    defaultMessage: "Private Variables",
    description: "Show all private variables",
  },
  unassignedVariable: {
    id: "plugins.devTools.unassignedVariable",
    defaultMessage: "Unassigned Variable",
    description: "Unassigned variable",
  },
});

let tackedVariablesCatch: Record<string, Record<string, VariableItemViewProps>> = {};

const VariablesView: React.FC = () => {
  const { intl, vm } = useDevToolsContext();
  const [stageId, setStageId] = React.useState("");
  const [targets, setTargets] = React.useState<string[]>([]);

  const targetsRef = React.useRef<string[]>([]);
  const stageName = React.useRef<string>("");

  const clearCache = React.useCallback(() => {
    devToolsObserver.set({ tackedVariables: {}, targetAndNameMap: {} });
  }, []);

  const useTackedVariablesCatch = React.useCallback((newTargets: Scratch.RenderTarget[]) => {
    for (let index = 0; index < newTargets.length; index++) {
      const target = newTargets[index];
      if (tackedVariablesCatch[target.id]) {
        for (const key in tackedVariablesCatch[target.id]) {
          const variable = tackedVariablesCatch[target.id][key] as VariableItemViewProps;
          variable.renderTargetName = target.sprite.name;
          const currentVar = target.variables[variable.variableId];
          if (currentVar) {
            variable.variableName = currentVar.name;
            const varKey = `${variable.renderTargetId}${variable.variableId}`;
            devToolsObserver.tackedVariables.assign({
              [varKey]: variable,
            });
          }
        }
      }
    }
    tackedVariablesCatch = {};
  }, []);

  const updateTargets = React.useCallback((newTargets: Scratch.RenderTarget[]) => {
    if (newTargets.length === 0) {
      clearCache();
    } else {
      useTackedVariablesCatch(newTargets);
      const stage = newTargets.shift();
      devToolsObserver.targetAndNameMap.assign({
        [stage.id]: stageName.current,
      });
      const targetIdList = [];
      for (let index = 0; index < newTargets.length; index++) {
        const target = newTargets[index];
        if (target.isOriginal) {
          targetIdList.push(target.id);
          devToolsObserver.targetAndNameMap.assign({
            [target.id]: target.sprite.name,
          });
        }
      }
      setStageId(stage.id);
      const targetsChange = detailedDiff(targetsRef.current, targetIdList);
      if (Object.keys(targetsChange.deleted).length) {
        Object.keys(targetsChange.deleted).forEach((idx) => {
          const targetId = targetsRef.current[idx];
          devToolsObserver.targetAndNameMap[targetId].delete();
          const obj = devToolsObserver.tackedVariables.peek();
          Object.keys(obj).forEach((key) => {
            if (obj[key].renderTargetId === targetId) {
              devToolsObserver.tackedVariables[key].delete();
            }
          });
        });
      }
      if (Object.keys(targetsChange.added).length || Object.keys(targetsChange.deleted).length) {
        setTargets(targetIdList);
      }
      targetsRef.current = targetIdList;
    }
  }, []);

  const handleCatchTackedVariables = React.useCallback(() => {
    tackedVariablesCatch = {};
    const tackedVariables = devToolsObserver.tackedVariables.peek();
    Object.keys(tackedVariables).forEach((key) => {
      const variable = tackedVariables[key];
      if (!tackedVariablesCatch[variable.renderTargetId]) {
        tackedVariablesCatch[variable.renderTargetId] = {};
      }
      tackedVariablesCatch[variable.renderTargetId][variable.variableId] = variable;
    });
  }, []);

  React.useEffect(() => {
    stageName.current = intl.formatMessage(messages.stage);
  }, [intl]);

  // 监测角色列表的变化
  React.useEffect(() => {
    const handleTargetsUpdate = () => {
      updateTargets([...vm.runtime.targets]);
    };
    // 初始化所有角色信息
    handleTargetsUpdate();
    vm.addListener("targetsUpdate", handleTargetsUpdate);
    return () => {
      handleCatchTackedVariables();
      clearCache();
      vm.removeListener("targetsUpdate", handleTargetsUpdate);
    };
  }, [vm]);

  return (
    <div className={styles.variables}>
      <div className={styles.category}>
        <div className={styles.categoryName}>{intl.formatMessage(messages.globalVariables)}</div>
        <div className={styles.empty}>{intl.formatMessage(messages.unassignedVariable)}</div>
        <TargetView id={stageId} />
      </div>
      <div className={styles.category}>
        <div className={styles.categoryName}>{intl.formatMessage(messages.privateVariables)}</div>
        <div className={styles.empty}>{intl.formatMessage(messages.unassignedVariable)}</div>
        {targets.map((id) => (
          <TargetView key={id} id={id} />
        ))}
      </div>
    </div>
  );
};

VariablesView.displayName = "VariablesView";

export default VariablesView;
