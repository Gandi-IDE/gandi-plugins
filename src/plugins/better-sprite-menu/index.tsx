import * as React from 'react';
import HistoricalVersionIcon from 'assets/icon--statistics.svg';

const BetterSpriteMenu: React.FC<PluginContext> = ({ redux, msg, registerSettings}) => {
  React.useEffect(() => {
    let currentSpriteMenuLayout = 'default'
    const menuLayoutList = ["default", "grid", "compact"]
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
      font-size: 0.7rem;
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

    .gandi_stage-selector_stage-selector_3oWOr{
      display: grid;
    }

    .gandi_collapsible-box_body_9ccdv {
      display: flex;
    }

    .gandi_stage-selector_stage-selector-info_bf2Ez {
      display: block;
      padding-top: 10px;
    }

    .gandi_stage-selector_title_1UlNu {
      padding-bottom: 10px;
      font-size: 0.625rem;
    }

    .gandi_stage-selector_name_2s1_t {
      padding: 10px;
      font-size: 0.6rem;
    }
    `

    const compactSpriteMenu = document.createElement('style')
    compactSpriteMenu.id = id + menuLayoutList[2]

    compactSpriteMenu.innerHTML = `
    .gandi_sprite-selector_sprite-wrapper_1C5Mq {
      width: min-content;
    }
    `

    const moveStageSelector = () => {
      let stageSelector = document.getElementsByClassName("gandi_target-pane_stage-selector-wrapper_qekSW");
      let targetPane = document.getElementsByClassName("gandi_target-pane_target-pane_3S5E6")[0];
      targetPane.appendChild(stageSelector[0]);

      let stageTitle = document.getElementsByClassName("gandi_stage-selector_title_1UlNu")
      let stageInfo = document.getElementsByClassName("gandi_stage-selector_stage-selector-info_bf2Ez")
      stageInfo[0].prepend(stageTitle[0])
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
          moveStageSelector()
          break;
        case "compact":
          document.head.appendChild(compactSpriteMenu);
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
