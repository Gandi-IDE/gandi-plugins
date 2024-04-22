import * as React from "react";
import { defineMessages } from "@formatjs/intl";
import { useDevToolsContext } from "src/plugins/dev-tools/lib/context";
import Tab from "components/Tab";
import IF from "components/IF";
import VariablesView from "../VariablesView";
import TackedVariables from "../TackedVariables";

import styles from "./styles.less";

const messages = defineMessages({
  variables: {
    id: "plugins.devTools.variables",
    defaultMessage: "Variables",
    description: "Show all the variables in the project",
  },
  variableMonitor: {
    id: "plugins.devTools.variableMonitor",
    defaultMessage: "VariableMonitor",
    description: "All variables specified for observation",
  },
});

const DevToolsPluginContent: React.FC = () => {
  const { intl } = useDevToolsContext();
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    window.$monitoringVariable = true;
    return () => {
      window.$monitoringVariable = false;
    };
  }, []);

  return (
    <div className={styles.container}>
      <Tab
        className={styles.tab}
        items={[intl.formatMessage(messages.variables), intl.formatMessage(messages.variableMonitor)]}
        activeIndex={currentIndex}
        onChange={setCurrentIndex}
      />
      <IF className={styles.tabWrapper} condition={currentIndex === 0}>
        <VariablesView />
      </IF>
      <IF className={styles.tabWrapper} condition={currentIndex === 1}>
        <TackedVariables />
      </IF>
    </div>
  );
};

DevToolsPluginContent.displayName = "DevToolsPluginContent";

export default DevToolsPluginContent;
