import { variableChangeEventBus } from "./dev-tools-observer";

export interface VariableChangeEventDetail {
  propertyName: string;
  value: VM.Variable["value"];
}

const onChange = (eventName: string, propertyName: string, value: VM.ScratchList | string) => {
  variableChangeEventBus.emit(eventName, {
    propertyName,
    value,
  });
};

function proxyVariableList(value: VM.ScratchList, eventName: string) {
  return new Proxy(value, {
    set(list, idx, val) {
      list[idx] = val;
      if (idx !== "length") {
        onChange(eventName, "value", [...list]);
      }
      return true;
    },
  });
}

export function addProxy(variable: VM.Variable, targetId: string) {
  const eventName = `${variable}${variable.id}`;
  const type = variable.type;
  let value = type === "list" ? proxyVariableList(variable.value as VM.ScratchList, eventName) : variable.value;
  let name = variable.name;
  Object.defineProperties(variable, {
    value: {
      get() {
        return value;
      },
      set: function (newValue) {
        const oldValue = value;
        if (type === "list") {
          newValue = proxyVariableList(newValue, eventName);
        }
        value = newValue;
        if (oldValue !== newValue) {
          onChange(eventName, "value", newValue);
        }
      },
    },
    name: {
      get() {
        return name;
      },
      set(newName: string) {
        const oldName = name;
        name = newName;
        if (oldName !== newName) {
          onChange(eventName, "name", name);
        }
      },
    },
  });
}

export function removeProxy(variable: VM.Variable, target: VM.RenderedTarget) {
  type VariableConstructor = {
    new (id: string, name: string, type: string, isCloud: boolean, targetId: string): VM.Variable;
  };
  const { id, name, type, value, isCloud } = variable;
  const Variable = variable.constructor as VariableConstructor;
  target.variables[id] = new Variable(id, name, type, isCloud, target.id);
  target.variables[id].value = type === "list" ? [...value] : value;
}
