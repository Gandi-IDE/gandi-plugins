import React from "react";
import hideCodeIcon from "assets/icon--hide-code.svg"
const HideCode = ({ registerSettings, msg }: PluginContext) => {
  const register = registerSettings(
    msg("plugins.hideCode.title"),
    "hide-code",
    [
      {
        key: "hide-code",
        label: msg("plugins.hideCode.title"),
        description: msg("plugins.hideCode.description"),
        items: [
          {
            key: "hide-code",
            label: msg("plugins.hideCode.addRightButton"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              if (value) {
                eval("OpenTeacherMode")
              } else {
                eval("CloseTeacherMode")
              }
            },
          },
        ],
      },
    ],
    React.createElement(hideCodeIcon)
  );
  
  return {
    dispose: () => {
      /** Remove some side effects */
      register.dispose();
      eval("CloseTeacherMode");
    },
  };
};

export default HideCode;
