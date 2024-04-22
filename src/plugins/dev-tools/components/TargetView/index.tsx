import * as React from "react";
import { defineMessages } from "react-intl";
import { useDevToolsContext } from "src/plugins/dev-tools/lib/context";
import { devToolsObserver } from "src/plugins/dev-tools/lib/dev-tools-observer";
import IF from "components/IF";
import CollapsibleItemView from "../CollapsibleItemView";
import VariableItemView from "../VariableView";
import { Computed } from "@legendapp/state/react";
import { addProxy, removeProxy } from "src/plugins/dev-tools/lib/proxy-variable";

export interface TargetItemProps {
  id: string;
}

interface IVariable {
  id: string;
  name: string;
  type: string;
  value: string | Array<string | number | boolean>;
}

const messages = defineMessages({
  variables: {
    id: "plugins.devTools.variables",
    defaultMessage: "Variables",
    description: "Show all the variables in the target",
  },
  lists: {
    id: "plugins.devTools.lists",
    defaultMessage: "Lists",
    description: "Show all the lists in the target",
  },
});

const disposalVariables = (variables: Record<string, Scratch.Variable>): IVariable[][] =>
  Object.keys(variables).reduce(
    (acc: IVariable[][], i) => {
      const item = variables[i];
      if (item.type === "list") {
        acc[1].push({
          id: item.id,
          name: item.name,
          type: "list",
          value: item.value,
        });
      } else if (item.type === "") {
        acc[0].push({
          id: item.id,
          name: item.name,
          type: "variable",
          value: item.value,
        });
      }
      return acc;
    },
    [[], []],
  );

const TargetItem: React.FC<TargetItemProps> = ({ id }) => {
  const { intl, vm } = useDevToolsContext();
  const target = vm.runtime.targets.find((t) => t.id === id);
  const [collapsed, setCollapsed] = React.useState(true);
  const [listsCollapsed, setListsCollapsed] = React.useState(true);
  const [variablesCollapsed, setVariablesCollapsed] = React.useState(true);
  const [variables, setVariables] = React.useState(disposalVariables(target?.variables || {}));
  const variablesRef = React.useRef({});
  const isEmpty = !variables[0].length && !variables[1].length;

  const handleCollapse = () => {
    setCollapsed((value) => !value);
  };

  const handleListsCollapsed = () => {
    setListsCollapsed((value) => !value);
  };

  const handleVariablesCollapse = () => {
    setVariablesCollapsed((value) => !value);
  };

  React.useEffect(() => {
    if (target) {
      const deleteVariable = target.deleteVariable.bind(target);
      // 处理删除变量的情况
      const superCreateVariable = function (variableId: string, isRemoteOperation?: boolean) {
        deleteVariable(variableId, isRemoteOperation);
        setTimeout(() => {
          if (variablesRef.current[variableId]) {
            delete variablesRef.current[variableId];
            setVariables(disposalVariables(variablesRef.current));
          }
          if (devToolsObserver.tackedVariables[`${id}${variableId}`].peek()) {
            devToolsObserver.tackedVariables[`${id}${variableId}`].delete();
          }
        });
      };
      target.deleteVariable = superCreateVariable.bind(vm.runtime);
      return () => {
        target.deleteVariable = deleteVariable;
      };
    }
  }, [target]);

  React.useEffect(() => {
    if (target) {
      Object.assign(variablesRef.current, target.variables);
      // 舞台的变量列表默认展开
      setCollapsed(!target.isStage);
      setListsCollapsed(target.isStage);
      setVariablesCollapsed(target.isStage);
      setVariables(disposalVariables(target.variables));
    }
  }, [target]);

  React.useEffect(() => {
    const handleCreateVariable = (e: CustomEvent) => {
      const { targetId, id: variableId, type, name, value } = e.detail;
      // 处理新增变量的情况
      if (targetId === id && !(variableId in variablesRef.current)) {
        const newVariables = {
          ...variablesRef.current,
          [variableId]: { id: variableId, type, name, value },
        };
        variablesRef.current = newVariables;
        setVariables(disposalVariables(newVariables));
      }
    };
    window.addEventListener("createVariable", handleCreateVariable);
    return () => {
      window.removeEventListener("createVariable", handleCreateVariable);
    };
  }, [id, vm]);

  React.useEffect(() => {
    if (target) {
      Object.keys(target.variables).forEach((variableId) => {
        addProxy(target.variables[variableId]);
      });
      return () => {
        Object.keys(target.variables).forEach((variableId) => {
          removeProxy(target.variables[variableId], target);
        });
      };
    }
  }, [target, variables]);

  // 角色不存在时不展示UI
  return target ? (
    <ul>
      <IF forceRender condition={!target.isStage && !isEmpty}>
        <Computed>
          {() => (
            <CollapsibleItemView
              collapsed={collapsed}
              name={devToolsObserver.targetAndNameMap[id].get()}
              onClick={handleCollapse}
            />
          )}
        </Computed>
      </IF>
      <IF forceRender condition={!collapsed}>
        <IF forceRender condition={target.isStage && !!variables[0].length}>
          <CollapsibleItemView
            collapsed={variablesCollapsed}
            name={intl.formatMessage(messages.variables)}
            onClick={handleVariablesCollapse}
          />
        </IF>
        <IF forceRender condition={!variablesCollapsed}>
          {variables[0].map((variable, index) => (
            <VariableItemView
              index={index}
              key={`${variable.id}${target.variables[variable.id].name}`}
              renderTargetId={target.id}
              renderTargetName={target.sprite.name}
              variableName={target.variables[variable.id].name}
              variableId={variable.id}
              variableValue={target.variables[variable.id].value}
            />
          ))}
        </IF>
        <IF forceRender condition={target.isStage && !!variables[1].length}>
          <CollapsibleItemView
            collapsed={listsCollapsed}
            name={intl.formatMessage(messages.lists)}
            onClick={handleListsCollapsed}
          />
        </IF>
        <IF forceRender condition={!listsCollapsed}>
          {variables[1].map((variable, index) => (
            <VariableItemView
              index={index}
              key={`${variable.id}${target.variables[variable.id].name}`}
              renderTargetId={target.id}
              renderTargetName={target.sprite.name}
              variableName={target.variables[variable.id].name}
              variableId={variable.id}
              variableValue={target.variables[variable.id].value}
            />
          ))}
        </IF>
      </IF>
    </ul>
  ) : null;
};

TargetItem.displayName = "TargetItem";

const areEqual = (prevProps: TargetItemProps, nextProps: TargetItemProps) => prevProps.id === nextProps.id;

export default React.memo(TargetItem, areEqual);
