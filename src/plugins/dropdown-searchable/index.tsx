import * as React from "react";
import DropdownSearchableIcon from "assets/icon--dropdown-searchable.svg";

const DropdownSearchable: React.FC<PluginContext> = ({ blockly, msg, registerSettings }) => {
  React.useEffect(() => {
    blockly.showDropdownSearchableDataType = false;
    blockly.showDropdownSearchableDropdowns = false;
    const register = registerSettings(
      msg("plugins.dropdownSearchable.title"),
      "plugin-dropdown-searchable",
      [
        {
          key: "dropdownSearchable",
          label: msg("plugins.dropdownSearchable.title"),
          description: msg("plugins.dropdownSearchable.description"),
          items: [
            {
              key: "dropdown",
              label: msg("plugins.dropdownSearchable.option.dropdown"),
              type: "switch",
              value: false,
              onChange: (value: boolean) => {
                blockly.showDropdownSearchableDropdowns = value;
              },
            },
            {
              key: "input",
              label: msg("plugins.dropdownSearchable.option.input"),
              type: "switch",
              value: false,
              onChange: (value: boolean) => {
                blockly.showDropdownSearchableDataType = value;
              },
            },
          ],
        },
      ],
      <DropdownSearchableIcon />,
    );
    return () => {
      register.dispose();
    };
  }, [registerSettings, msg]);

  return null;
};

DropdownSearchable.displayName = "DropdownSearchable";

export default DropdownSearchable;
