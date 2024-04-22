import * as React from "react";

const Folder: React.FC<PluginContext> = ({ redux }) => {
  React.useEffect(() => {
    redux.dispatch({
      type: "scratch-gui/global-settings/UPDATE_FOLDER_USEABLE",
      useable: true,
    });
    return () => {
      redux.dispatch({
        type: "scratch-gui/global-settings/UPDATE_FOLDER_USEABLE",
        useable: false,
      });
    };
  }, [redux]);

  return null;
};

Folder.displayName = "Folder";

export default Folder;
