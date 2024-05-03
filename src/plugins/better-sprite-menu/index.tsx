import * as React from 'react';
import HistoricalVersionIcon from 'assets/icon--statistics.svg';

const BetterSpriteMenu: React.FC<PluginContext> = ({ redux, msg, registerSettings}) => {
  React.useEffect(() => {
    let currentSpriteMenuLayout = 'default'
    const menuLayoutList = ["default", "grid", "compact", "superCompact"]
    const id = "BetterSpriteMenu";

    const gridSpriteMenu = document.createElement('style')
    gridSpriteMenu.id = id + menuLayoutList[1]
    gridSpriteMenu.innerHTML = `
    .gandi_sprite-selector-item_target-visible-button_2fD8J {
      display: none;
    }
    
    .gandi_sprite-selector-item_more_kADxQ {
      display: none;
    }
    
    .gandi_sprite-selector_sprite-wrapper_1C5Mq {
      display: flex;
      border: 2px solid var(--theme-color-300);
      border-radius: 0.5rem;
      box-sizing: border-box;
      width: calc((100% / 5 ) - 0.5rem);
      max-width: 4.21rem;
      min-width: 4rem;
      min-height: 4rem;
      margin: calc(0.5rem / 2);
      padding-top: 3px;
      padding-left: 3px;
    }
    .gandi_sprite-selector_sprite_21WnR {
      display: block;
      height: 100%;
      position: relative;
    }
    
    .gandi_sprite-selector-item_sprite-image-outer_2R2jZ {
      width: 100%;
      height: 100%;
      margin: 0;
      flex-shrink: 0;
      border-radius: 2px;
      border-radius: 0.5rem;
    }
    
    .gandi_sprite-selector-item_sprite-image-inner_3u66z {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      max-height: 36px;
      border-radius: 0.5rem;
    } 
    
    .gandi_sprite-selector-item_sprite-info_EBuo9 {
      display: flex;
      flex-direction: column;
      font-size: 14px;
      -webkit-user-select: none;
      user-select: none;
      bottom: 1.2rem;
      position: relative;
      background: var(--theme-color-300);
      height: 1.5rem;
      justify-content: flex-start;
      text-align: center;
      display: flex;
      padding-top: 2px;
      font-size: 0.625rem;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      text-overflow: ellipsis;
    }
    
    .gandi_sprite-selector-item_sprite-item_2leTl {
      background-color: var(--theme-brand-color);
      color: #fff;
      overflow: hidden;
      border-radius: 0.5rem;
    }
    
    .gandi_sprite-selector-item_sprite-item_2leTl.gandi_sprite-selector-item_is-selected_1u9Zv{
      background: var(--theme-brand-color);
      color: #fff;
      box-shadow: 0px 0px 0px 4px var(--gui-item-active-transparent);
      overflow: hidden;
      border-radius: 0.5rem;
    }
    
    .gandi_sprite-selector-item_sprite-item_2leTl.gandi_sprite-selector-item_is-selected_1u9Zv .gandi_sprite-selector-item_sprite-info_EBuo9{
      background: var(--theme-brand-color);
    }
    .gandi_sprite-selector-item_sprite-item_2leTl.gandi_sprite-selector-item_is-selected_1u9Zv .gandi_sprite-selector_sprite-wrapper_1C5Mq{
      border-color: var(--theme-color-300);
    }

    .gandi_sprite-selector-item_folder_YmvKs {
      padding-bottom: 11px;
    }
    `

    const compactSpriteMenu = document.createElement('style')
    compactSpriteMenu.id = id + menuLayoutList[2]

    compactSpriteMenu.innerHTML = `
    .gandi_sprite-selector_sprite-wrapper_1C5Mq {
      height: 25px;
    }
    .gandi_sprite-selector-item_sprite-item_2leTl {
      height: 110%
    }
    .gandi_sprite-selector-item_target-visible-button_2fD8J, .gandi_sprite-selector-item_more_kADxQ {
      display: none;
    }
    .gandi_sprite-selector-item_sprite-image-outer_2R2jZ {
      width: 20px;
      height: 20px;
    }
    .gandi_sprite-selector-item_sprite-info_EBuo9 {
      font-size: 11px;
    }

    .gandi_stage-selector_stage-selector_3oWOr {
      height: 30px;
    }
    .gandi_stage-selector_costume-canvas_2L_6h {
      height: 20px
    }
    .gandi_stage-selector_name_2s1_t, .gandi_stage-selector_title_1UlNu {
      font-size: 11px;
    }
    `

    const superCompactSpriteMenu = document.createElement('style')
    superCompactSpriteMenu.id = id + menuLayoutList[3]

    superCompactSpriteMenu.innerHTML = `
    .gandi_sprite-selector_sprite-wrapper_1C5Mq {
      height: 25px;
      width: 89.5px;
    }
    .gandi_sprite-selector-item_sprite-item_2leTl {
      height: 110%
      border-right: 1px solid var(--theme-color-200);
    }
    .gandi_sprite-selector-item_target-visible-button_2fD8J, .gandi_sprite-selector-item_more_kADxQ {
      display: none;
    }
    .gandi_sprite-selector-item_sprite-image-outer_2R2jZ {
      width: 20px;
      height: 20px;
    }
    .gandi_sprite-selector-item_sprite-info_EBuo9 {
      font-size: 11px;
    }

    .gandi_stage-selector_stage-selector_3oWOr {
      height: 30px;
    }
    .gandi_stage-selector_costume-canvas_2L_6h {
      height: 20px
    }
    .gandi_stage-selector_name_2s1_t, .gandi_stage-selector_title_1UlNu {
      font-size: 11px;
    }
    `

    //Used to reorginize the stage selector to achive vertical stage selector
    //Also used with some extra CSS styles but they are deleted. Don't worry, it's not THAT hard to recreate, totally...
    const stageInit = () => {
      let spriteInfo = document.getElementsByClassName("gandi_sprite-info_sprite-info_3EyZh")[0];
      let spriteSelector = document.getElementsByClassName("gandi_sprite-selector_sprite-selector_2KgCX")[0];
      spriteSelector.prepend(spriteInfo);
    
      let stageTitle = document.getElementsByClassName("gandi_stage-selector_title_1UlNu")[0]
      let stageInfo = document.getElementsByClassName("gandi_stage-selector_stage-selector-info_bf2Ez")[0]
      stageInfo.prepend(stageTitle)
    
      let stageSelector = document.getElementsByClassName("gandi_target-pane_stage-selector-wrapper_qekSW")[0]
      let targetPane = document.getElementsByClassName("gandi_target-pane_target-list_10PNw")[0]
      targetPane.append(stageSelector)
    }

    const updateSpriteMenuStyle = () => {
      for (let i = 0; i < menuLayoutList.length; i++) {
        const element = document.getElementById(id + menuLayoutList[i]);
        if (element) {
          element.remove()
        }
      }
      switch(currentSpriteMenuLayout) {
        case "grid":
          document.head.appendChild(gridSpriteMenu);
          //stageInit()
          break;
        case "compact":
          document.head.appendChild(compactSpriteMenu);
          break;
        case "superCompact":
          document.head.appendChild(superCompactSpriteMenu);
          break;
      }
    }

    const register = registerSettings(
      msg('plugins.betterSpriteMenus.title'),
      'better-sprite-menus',
      [
        {
          key: 'layouts',
          label: msg('plugins.betterSpriteMenus.title'),
          items: [
            {
              key: 'selector',
              type: 'select',
              label: msg('plugins.betterSpriteMenus.layouts'),
              value: currentSpriteMenuLayout,
              options: [
                { label: msg('plugins.betterSpriteMenus.layout.default'), value: menuLayoutList[0] },
                { label: msg('plugins.betterSpriteMenus.layout.grid'), value: menuLayoutList[1] },
                { label: msg('plugins.betterSpriteMenus.layout.compact'), value: menuLayoutList[2] },
                { label: msg('plugins.betterSpriteMenus.layout.superCompact'), value: menuLayoutList[3] },
              ],
              onChange: (value) => {
                currentSpriteMenuLayout = value.toString();
                updateSpriteMenuStyle();
                console.log(redux)
              },
            },
          ],
        },
      ],
      <HistoricalVersionIcon />,
    );
    return () => {
      register.dispose();
    };
  }, [registerSettings, msg]);

  // Use the layout style in your render method
  return null;
};

BetterSpriteMenu.displayName = 'BetterSpriteMenu';

export default BetterSpriteMenu;
