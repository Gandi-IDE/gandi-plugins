let PROTOTYPE_OPCODE;
import { scrollBlockIntoView } from "utils/block-helper";
const goToDefinition = (procCode,vm,workspace) => {
  let prototypeBlockInTarget,targetId;
  for(let target of vm.runtime.targets){
    if(target.id !== vm.editingTarget.id && !target.sprite.name.startsWith('#modules/')){
      continue
    }
    console.log(target.blocks)
    for(let block of Object.values(target.blocks._blocks)){
      if(block.opcode === PROTOTYPE_OPCODE && (block.mutation.isglobal || target.id === vm.editingTarget.id) && block.mutation.proccode === procCode){
        prototypeBlockInTarget = block;
        targetId = target.id;
        break;
      }
    }
  }
  if(!prototypeBlockInTarget){
    console.warn('没有找到定义块，无法跳转')
    return;
  }
  if(targetId !== vm.editingTarget.id){
    console.log('切换目标',targetId)
    vm.setEditingTarget(targetId);
  }
  console.log('prototype block',workspace.blockDB_[prototypeBlockInTarget.id])
  const prototypeBlock = workspace.blockDB_[prototypeBlockInTarget.id]
  const defineBlock = prototypeBlock.parentBlock_
  scrollBlockIntoView(defineBlock,workspace);
}
const handleGoToDefinition = function(vm,blockly){
  const procCode = this.procCode_;
  console.log('被点了',procCode)
  console.log(vm.runtime)
  if(!procCode){
    console.warn('没有procCode，无法跳转')
    return;
  }
  const target = vm.editingTarget;
  goToDefinition(procCode,vm,blockly.getMainWorkspace());
}
const FindDefinition = ({blockly,vm,registerSettings,msg}) => {
  console.log(blockly,vm,registerSettings)
  if(blockly.Blocks[blockly.PROCEDURES_CALL_BLOCK_TYPE]){
    console.log('检测到自定义快，可以替换blockly')
    PROTOTYPE_OPCODE = blockly.PROCEDURES_PROTOTYPE_BLOCK_TYPE
    const ctx_menu_ext = blockly.ScratchBlocks.VerticalExtensions.PROCEDURE_CALL_CONTEXTMENU
    ctx_menu_ext._orig = ctx_menu_ext.customContextMenu
    ctx_menu_ext.customContextMenu = function(menuOptions){
      ctx_menu_ext._orig.call(this,menuOptions)//block sharing插件的插入方式不太对，会把ui顶开，还是让白猫来解决吧   2025/7/20
      menuOptions.push({
        'text':msg("plugins.findDefinition.goToDefinition"),
        'enabled':true,
        'callback':handleGoToDefinition.bind(this,vm,blockly),
      })
      
    }
  }
  const register = registerSettings(
    msg("plugins.findDefinition.name"),
    'plugin-find-definition',
    [
      {
        key: "plugin-find-definition",
        label: msg("plugins.findDefinition.name"),
        description: msg("plugins.findDefinition.description"),
        items:[]
      }
    ],
    ''
  );
  return {
    dispose: () => {
      /** Remove some side effects */
      const ctx_menu_ext = blockly.ScratchBlocks.VerticalExtensions.PROCEDURE_CALL_CONTEXTMENU
      ctx_menu_ext.customContextMenu = ctx_menu_ext._orig
      ctx_menu_ext._orig = undefined
      register.dispose()
    },
  };
};

export default FindDefinition;
