/**
 * dts 包含了用于extraLib载入的.d.ts的文件内容
 * @type {string}
 */
import dts from './scratch-vm-dts.d.ts.asset'

const ExtensionTypeDefinition = ({ vm, registerSettings, msg }) => {
    if (!window?.monaco?.languages?.typescript?.javascriptDefaults) {
        console.warn('ide未在全局暴露monaco或其js语言功能,无法加载插件' + msg("plugins.extensionTypeDefinition.title"))
        return { dispose: () => { } }
    }
    // vm.runtime.gandi._supportedAssetTypes.push({ //测试用
    //     "contentType": "text/javascript",
    //     "name": "Extension",
    //     "runtimeFormat": "js",
    //     "immutable": true
    // })
    const register = registerSettings(
        msg("plugins.extensionTypeDefinition.title"),
        "plugin-extension-type-definition",
        [
            {
                key: "plugin-extension-type-definition",
                label: msg("plugins.extensionTypeDefinition.title"),
                description: msg("plugins.extensionTypeDefinition.description"),
                items: [],
            },
        ],
        "",
    );
    window.monaco.languages.typescript.javascriptDefaults.addExtraLib(dts, 'global.d.ts')
    console.log('monaco d.ts文件已载入')
    return {
        dispose: () => {
            /** Remove some side effects */
            register.dispose()
        },
    };
};

export default ExtensionTypeDefinition;
