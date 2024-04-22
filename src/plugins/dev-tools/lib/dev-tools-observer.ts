import { observable } from "@legendapp/state";
import { VariableItemViewProps } from "../components/VariableView";
import EventBus from "./event-bus";

export type ListVariable = Array<string | boolean | number>;

export const devToolsObserver = observable<{
  tackedVariables: Record<string, VariableItemViewProps>;
  targetAndNameMap: Record<string, string>;
}>({ tackedVariables: {}, targetAndNameMap: {} });

export const variableKeysList = new Set<string>();

export const variableChangeEventBus = new EventBus();
