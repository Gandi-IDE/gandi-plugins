let PROTOTYPE_OPCODE, CALL_OPCODE, CALL_RETURN_OPCODE, CTX_MENU_EXT;
import { scrollBlockIntoView } from "utils/block-helper";
const getBlockInMainWorkspace = (blockly, blockId) => {
    const workspace = blockly.getMainWorkspace();
    if (!workspace) {
        console.warn("没有工作区，无法获取块");
        return null;
    }
    const block = workspace.blockDB_[blockId];
    if (!block) {
        console.warn("没有找到块", blockId);
        return null;
    }
    return block;
};
const goToDefinition = (call_block, vm, workspace, blockly) => {
    const procCode = call_block.procCode_
    let prototypeBlockInTarget, targetId;
    if (!call_block.isGlobal_) {
        for (let block of Object.values(vm.editingTarget.blocks._blocks)) {
            if (
                block.opcode === PROTOTYPE_OPCODE &&//如果是定义块
                block.mutation.proccode === procCode//并且定义块的procCode与调用块的procCode相同
            ) {
                prototypeBlockInTarget = block;
                targetId = vm.editingTarget.id;
                break;
            }
        }
    } else {
        for (let target of vm.runtime.targets) {//遍历每一个角色，在模块或当前角色中搜索自制积木的定义块
            if (target.isModule) {
                for (let block of Object.values(target.blocks._blocks)) {
                    if (
                        block.opcode === PROTOTYPE_OPCODE &&//如果是定义块
                        block.mutation.isglobal === 'true' &&//并且是全局的
                        block.mutation.proccode === procCode//并且定义块的procCode与调用块的procCode相同
                    ) {
                        prototypeBlockInTarget = block;
                        targetId = target.id;
                        break;
                    }
                }
            }
        }
    }
    // for (let target of vm.runtime.targets) {//遍历每一个角色，在模块或当前角色中搜索自制积木的定义块
    // 	if (target.id !== vm.editingTarget.id && !target.isModule) {
    // 		continue;
    // 	}
    // 	console.log(target.blocks);
    // 	for (let block of Object.values(target.blocks._blocks)) {
    // 		if (
    // 			block.opcode === PROTOTYPE_OPCODE &&//如果是定义块
    // 			(block.mutation.isglobal === 'true' || target.id === vm.editingTarget.id) &&//并且是全局的或当前角色
    // 			block.mutation.proccode === procCode//并且定义块的procCode与调用块的procCode相同
    // 		) {
    // 			prototypeBlockInTarget = block;
    // 			targetId = target.id;
    // 			break;
    // 		}
    // 	}
    // }
    if (!prototypeBlockInTarget) {
        console.warn("没有找到定义块，无法跳转");
        return;
    }
    const src_target_id = vm.editingTarget.id;//记录调用自制积木的角色id
    const dst_target_id = targetId;//记录定义自制积木的角色id
    if (targetId !== vm.editingTarget.id) {
        vm.setEditingTarget(targetId);
    }
    const prototypeBlock = getBlockInMainWorkspace(blockly, prototypeBlockInTarget.id);
    const defineBlock = prototypeBlock.parentBlock_;//prototype无法进行跳转，所以需要获取其父块definition
    scrollBlockIntoView(defineBlock, workspace);
    class MoveWorkspaceEvent extends blockly.Events.Abstract {
        constructor(src_target_id, src_block_id, dst_target_id, dst_block_id, workspace) {
            super()
            this.type = 'GOTO_DEF'
            this.src_target_id = src_target_id
            this.src_block_id = src_block_id
            this.dst_target_id = dst_target_id
            this.dst_block_id = dst_block_id
            this.workspace = workspace
            this.recordUndo = true//记录撤销
        }
        run(redo) {
            if (redo) {
                vm.setEditingTarget(this.dst_target_id);
                scrollBlockIntoView(getBlockInMainWorkspace(blockly, this.dst_block_id), this.workspace)//跳转至定义(要通过id获取,否则跨角色会获取失败)
            }
            else {
                vm.setEditingTarget(this.src_target_id);
                scrollBlockIntoView(getBlockInMainWorkspace(blockly, this.src_block_id), this.workspace)//跳转回引用
            }
        }
    }
    workspace.fireChangeListener(new MoveWorkspaceEvent(src_target_id, call_block.id, dst_target_id, defineBlock.id, workspace))//记录跳转事件
};
const handleGoToDefinition = function (vm, blockly) {
    if (!this.getProcCode) {
        console.warn("没有procCode，无法跳转");
        return;
    }
    goToDefinition(this, vm, blockly.getMainWorkspace(), blockly);
};
const refreshBlocksWithOpcodes = (blockly, opcodes) => {
    for (let block of blockly.getMainWorkspace().getAllBlocks()) {
        if (opcodes.includes(block.type)) {
            block.customContextMenu = CTX_MENU_EXT.customContextMenu
        }
    }
    blockly.getMainWorkspace().getToolbox().showAll_()
}
const FindDefinition = ({ blockly, vm, registerSettings, msg }) => {
    if (blockly.Blocks[blockly.PROCEDURES_CALL_BLOCK_TYPE]) {
        PROTOTYPE_OPCODE = blockly.PROCEDURES_PROTOTYPE_BLOCK_TYPE;
        CALL_OPCODE = blockly.PROCEDURES_CALL_BLOCK_TYPE;
        CALL_RETURN_OPCODE = blockly.PROCEDURES_CALL_WITH_RETURN_BLOCK_TYPE;
        CTX_MENU_EXT = blockly.ScratchBlocks.VerticalExtensions.PROCEDURE_CALL_CONTEXTMENU;
        CTX_MENU_EXT._orig = CTX_MENU_EXT.customContextMenu;
        CTX_MENU_EXT.customContextMenu = function (menuOptions) {
            if (CTX_MENU_EXT._orig === undefined) {
                console.warn("菜单未刷新，可尝试切换角色");//一般不会运行，因为删除插件时会刷新
                return;
            }
            CTX_MENU_EXT._orig.call(this, menuOptions);//调用原有菜单
            menuOptions.push({//加入自定义菜单项
                text: msg("plugins.findDefinition.goToDefinition"),
                enabled: true,
                callback: handleGoToDefinition.bind(this, vm, blockly),
            });
        };
        refreshBlocksWithOpcodes(blockly, [CALL_OPCODE, CALL_RETURN_OPCODE]);

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
            CTX_MENU_EXT.customContextMenu = CTX_MENU_EXT._orig;
            CTX_MENU_EXT._orig = undefined;
            const workspace = blockly.getMainWorkspace();
            if (!workspace) {
                console.warn("没有工作区，无法删除原有菜单");
                return;
            }
            refreshBlocksWithOpcodes(blockly, [CALL_OPCODE, CALL_RETURN_OPCODE]);
            // workspace.clearUndo(); 我不想使用这个，因为会清除所有撤销记录
            // 可能导致用户无法撤销之前的操作
            // 但可以通过遍历undoStack并删除的方式来清除跳转事件
            const new_undo_stack = workspace.undoStack_.filter(event => event.type !== 'GOTO_DEF');
            workspace.undoStack_ = new_undo_stack;
            //同时，也需要删除redoStack
            const new_redo_stack = workspace.redoStack_.filter(event => event.type !== 'GOTO_DEF');
            workspace.redoStack_ = new_redo_stack;
            register.dispose();
        },
    };
};

export default FindDefinition;
