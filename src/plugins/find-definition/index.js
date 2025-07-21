let PROTOTYPE_OPCODE, CALL_OPCODE, CALL_RETURN_OPCODE, CTX_MENU_EXT;
import { scrollBlockIntoView } from "utils/block-helper";
const goToDefinition = (procCode, vm, workspace) => {
	let prototypeBlockInTarget, targetId;
	for (let target of vm.runtime.targets) {
		if (target.id !== vm.editingTarget.id && !target.sprite.name.startsWith("#modules/")) {
			continue;
		}
		console.log(target.blocks);
		for (let block of Object.values(target.blocks._blocks)) {
			if (
				block.opcode === PROTOTYPE_OPCODE &&
				(block.mutation.isglobal || target.id === vm.editingTarget.id) &&
				block.mutation.proccode === procCode
			) {
				prototypeBlockInTarget = block;
				targetId = target.id;
				break;
			}
		}
	}
	if (!prototypeBlockInTarget) {
		console.warn("没有找到定义块，无法跳转");
		return;
	}
	if (targetId !== vm.editingTarget.id) {
		console.log("切换目标", targetId);
		vm.setEditingTarget(targetId);
	}
	console.log("prototype block", workspace.blockDB_[prototypeBlockInTarget.id]);
	const prototypeBlock = workspace.blockDB_[prototypeBlockInTarget.id];
	const defineBlock = prototypeBlock.parentBlock_;
	scrollBlockIntoView(defineBlock, workspace);
};
const handleGoToDefinition = function (vm, blockly) {
	const procCode = this.procCode_;
	console.log("被点了", procCode);
	debugger
	if (!procCode) {
		console.warn("没有procCode，无法跳转");
		return;
	}
	goToDefinition(procCode, vm, blockly.getMainWorkspace());
};
const FindDefinition = ({ blockly, vm, registerSettings, msg }) => {
	console.log(blockly, vm, registerSettings);
	if (blockly.Blocks[blockly.PROCEDURES_CALL_BLOCK_TYPE]) {
		console.log("检测到自定义快，可以替换blockly");
		PROTOTYPE_OPCODE = blockly.PROCEDURES_PROTOTYPE_BLOCK_TYPE;
		CALL_OPCODE = blockly.PROCEDURES_CALL_BLOCK_TYPE;
		CALL_RETURN_OPCODE = blockly.PROCEDURES_CALL_WITH_RETURN_BLOCK_TYPE;
		CTX_MENU_EXT = blockly.ScratchBlocks.VerticalExtensions.PROCEDURE_CALL_CONTEXTMENU;
		CTX_MENU_EXT._orig = CTX_MENU_EXT.customContextMenu;
		CTX_MENU_EXT.customContextMenu = function (menuOptions) {
			if(CTX_MENU_EXT._orig === undefined) {
				console.warn("菜单需刷新");
				return;
			}
			CTX_MENU_EXT._orig.call(this, menuOptions);
			menuOptions.push({
				text: msg("plugins.findDefinition.goToDefinition"),
				enabled: true,
				callback: handleGoToDefinition.bind(this, vm, blockly),
			});
		};
		
	}
	const register = registerSettings(
		msg("plugins.findDefinition.title"),
		"plugin-find-definition",
		[
			{
				key: "plugin-find-definition",
				label: msg("plugins.findDefinition.title"),
				description: msg("plugins.findDefinition.description"),
				items: [],
			},
		],
		"",
	);
	return {
		dispose: () => {
			/** Remove some side effects */
			CTX_MENU_EXT = blockly.ScratchBlocks.VerticalExtensions.PROCEDURE_CALL_CONTEXTMENU;
			console.log(CTX_MENU_EXT._orig === CTX_MENU_EXT.customContextMenu);
			CTX_MENU_EXT.customContextMenu = CTX_MENU_EXT._orig;
			CTX_MENU_EXT._orig = undefined;
			const workspace = blockly.getMainWorkspace();
			if (!workspace) {
				console.warn("没有工作区，无法删除原有菜单");
				return;
			}
			register.dispose();
		},
	};
};

export default FindDefinition;
