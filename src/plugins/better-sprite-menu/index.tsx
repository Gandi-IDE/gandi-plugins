import * as React from 'react';
import BetterSpriteMenuIcon from 'assets/icon--BetterSpriteMenu.svg';

const BetterSpriteMenu: React.FC<PluginContext> = ({ redux, msg, registerSettings}) => {
  React.useEffect(() => {
    let currentSpriteMenuLayout = 'default'
    const menuLayoutList = ["default", "grid", "compact", "superCompact"]
    const id = "BetterSpriteMenu_";

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
      margin: calc(0.3rem / 2);
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
    const removeAllStyles = () => {
      for (let i = 0; i < menuLayoutList.length; i++) {
        const element = document.getElementById(id + menuLayoutList[i]);
        if (element) {
          element.remove()
        }
      }
    }
    const updateSpriteMenuStyle = () => {
      removeAllStyles()
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

    let collapsibleBox = document.querySelectorAll('.gandi_collapsible-box_collapsible-box_1_329')[1];

    // Create a new MutationObserver instance
    let observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === "class" && currentSpriteMenuLayout == "grid") {
          let targetElement = mutation.target as Element;
          let newClassList = targetElement.className.split(' ');

          if (newClassList.includes('gandi_collapsible-box_collapsed_oQuU1')) {
            console.log('The element contains the class "gandi_collapsible-box_collapsed_oQuU1"');
            removeAllStyles();
          } else {
            updateSpriteMenuStyle()
          }
        }
      });
    });

    let config = { attributes: true, attributeFilter: ['class'] };
    observer.observe(collapsibleBox, config);
    
    const register = registerSettings(
      msg('plugins.betterSpriteMenu.title'),
      'Better Sprite Menu',
      [
        {
          key: 'layouts',
          label: msg('plugins.betterSpriteMenu.layouts'),
          items: [
            {
              key: 'layout',
              type: 'select',
              label: msg('plugins.betterSpriteMenu.layouts.label'),
              value: currentSpriteMenuLayout,
              options: [
                { label: msg('plugins.betterSpriteMenu.layouts.default'), value: menuLayoutList[0] },
                { label: msg('plugins.betterSpriteMenu.layouts.grid'), value: menuLayoutList[1] },
                { label: msg('plugins.betterSpriteMenu.layouts.compact'), value: menuLayoutList[2] },
                { label: msg('plugins.betterSpriteMenu.layouts.superCompact'), value: menuLayoutList[3] },
              ],
              onChange: (value) => {
                currentSpriteMenuLayout = value.toString();
                updateSpriteMenuStyle();
              },
            },
          ],
        },
      ],
      <BetterSpriteMenuIcon />,
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
