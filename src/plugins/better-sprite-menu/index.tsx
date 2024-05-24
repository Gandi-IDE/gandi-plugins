import * as React from 'react';
import BetterSpriteMenuIcon from 'assets/icon--BetterSpriteMenu.svg';
import styles from './styles.less'

let currentSpriteMenuLayout = 'default'
    const menuLayoutList = ["default", "grid", "compact", "superCompact"]

    const removeAllStyles = () => {
      document.body.classList.remove(styles.grid);
      document.body.classList.remove(styles.compact);
      document.body.classList.remove(styles.superCompact);
    }
    const updateSpriteMenuStyle = () => {
      removeAllStyles()
      switch(currentSpriteMenuLayout) {
        case "grid":
          document.body.classList.add(styles.grid);
          //stageInit()
          break;
        case "compact":
          document.body.classList.add(styles.compact);
          break;
        case "superCompact":
          document.body.classList.add(styles.superCompact);
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
    

const BetterSpriteMenu: React.FC<PluginContext> = ({ redux, msg, registerSettings}) => {
  React.useEffect(() => {
    currentSpriteMenuLayout = 'default'
    const register = registerSettings(
      msg('plugins.betterSpriteMenu.title'),
      'Better Sprite Menu',
      [
        {
          key: 'layouts',
          label: msg('plugins.betterSpriteMenu.title'),
          description: msg("plugins.betterSpriteMenu.description"),
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
      removeAllStyles()
      register.dispose();
    };
  }, [registerSettings, msg]);

  // Use the layout style in your render method
  return null;
};

BetterSpriteMenu.displayName = 'BetterSpriteMenu';

export default BetterSpriteMenu;
