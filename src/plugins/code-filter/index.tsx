import * as React from "react";
import * as ReactDOM from "react-dom";
import { debounce } from "lodash-es";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import Tooltip from "components/Tooltip";
import { defineMessages } from "@formatjs/intl";
import useStorageInfo from "hooks/useStorageInfo";
import DomHelpers from "utils/dom-helper";
import codeHash from "lib/code-hash.json";
import { hotkeyIsDown, transitionHotkeysToString } from "utils/hotkey-helper";
import XML from "utils/xml";
import CodeFilterIcon from "assets/icon--code-filter.svg";
import styles from "./styles.less";

interface SelectOption {
  desc: string;
  block: Blockly.Block;
  dom: HTMLElement;
}

const DEFAULT_SETTINGS = {
  hotkeys: {
    visible: ["altKey", "F"],
  },
};

const DEFAULT_CONTAINER_INFO = {
  width: 300,
  height: 450,
  translateX: 72,
  translateY: 60,
};

const messages = defineMessages({
  intro: {
    id: "plugins.codeFilter.intro",
    defaultMessage: "Filter blocks in toolbox",
    description: "Quick Filters",
  },
  title: {
    id: "plugins.codeFilter.title",
    defaultMessage: "Filter Blocks",
    description: "Filter Blocks",
  },
});

const fuzzySearch = (targetStr: string, stringArray: Array<{ desc: string }>) => {
  const regex = new RegExp(targetStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const matches = [];
  for (let i = 0; i < stringArray.length; i++) {
    if (regex.test(stringArray[i].desc)) {
      matches.push(stringArray[i]);
    }
  }
  return matches;
};

// 下拉列表最大显示的行数
const DROPDOWN_BLOCK_LIST_MAX_ROWS = 25;

const CodeFilter: React.FC<PluginContext> = ({ workspace, intl, vm, registerSettings, trackEvents }) => {
  const [visible, setVisible] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [shortcutKey, setShortcutKey] = React.useState(DEFAULT_SETTINGS.hotkeys.visible);
  const [containerInfo, setContainerInfo] = useStorageInfo<ExpansionRect>(
    "TOOLBOX_BLOCKS_SEARCH_CONTAINER_INFO",
    DEFAULT_CONTAINER_INFO,
  );
  const [options, setOptions] = React.useState<Array<SelectOption>>([]);
  const oldVisibleRef = React.useRef(null);
  const mouseInWorkspace = React.useRef(false);
  const windowWH = React.useRef({ w: 0, h: 0 });
  const mouseXY = React.useRef({ x: 0, y: 0 });
  const containerInfoRef = React.useRef(containerInfo);
  const searchInputRef = React.useRef(null);
  const blockListRef = React.useRef<HTMLUListElement | null>(null);
  const domHelpers = React.useMemo(() => new DomHelpers(), []);
  const hoverText = React.useMemo(() => intl.formatMessage(messages.intro), []);
  const optionRef = React.useRef([]);
  const blocksRef = React.useRef([]);
  const defaultShowed = React.useRef(false);
  const selectedOptionIndex = React.useRef(-1);

  const handleSelectOption = React.useCallback((idx: number) => {
    if (!blockListRef.current || selectedOptionIndex.current === idx) return;
    selectedOptionIndex.current = idx;
    for (let index = 0; index < blockListRef.current.children.length; index++) {
      const li = blockListRef.current.children[index];
      if (idx === index) {
        li.classList.add(styles.selected);
        li.scrollIntoView({ block: "center", inline: "start" });
      } else {
        li.classList.remove(styles.selected);
      }
    }
  }, []);

  const updateOptions = React.useCallback(
    (newOptions: Array<SelectOption>) => {
      setOptions(newOptions);
      handleSelectOption(-1);
    },
    [handleSelectOption],
  );

  const handleRecommend = React.useCallback((type: string) => {
    const key = Object.keys(codeHash).find((i) => i.includes(type));
    const recommendBlocksStr: string = codeHash[key];

    if (recommendBlocksStr) {
      const recommendBlocksArr = recommendBlocksStr.slice(1, -1).split(",").filter(Boolean);
      const newOptions = new Array(DROPDOWN_BLOCK_LIST_MAX_ROWS);
      let count = 0;
      initializeBlocks();
      for (let index = 0; index < blocksRef.current.length; index++) {
        const item = blocksRef.current[index];
        const idx = recommendBlocksArr.findIndex((i) => i === item.block.type);
        if (idx !== -1) {
          if (newOptions[idx]) {
            newOptions[idx].push(item);
          } else {
            newOptions[idx] = [item];
          }
          count++;
        }
        if (count === DROPDOWN_BLOCK_LIST_MAX_ROWS) {
          break;
        }
      }
      updateOptions(
        newOptions.reduce((t, i) => {
          if (i) {
            return [...t, ...i];
          }
          return t;
        }, []),
      );
    }
  }, []);

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    setContainerInfo({
      ...containerInfoRef.current,
      translateX: rect.x + 28,
      translateY: rect.y - 6,
    });
    setVisible(true);
  }, []);

  const getContainerPosition = () => {
    const { w, h } = windowWH.current;
    const { x, y } = mouseXY.current;
    const translateX = w - (x + 20) < 300 ? x - 300 : x + 20;
    const translateY = h - (y - 8) < 254 ? y - 254 : y - 12;
    return { translateX, translateY };
  };

  const initializeBlocks = React.useCallback(() => {
    const allBlocks = [];
    const toolbox = workspace.getToolbox();
    const toolboxWorkspace = toolbox.flyout_.getWorkspace();
    const topBlocks = toolboxWorkspace.getTopBlocks();

    const fullDom = window.Blockly.Xml.workspaceToDom(toolboxWorkspace);
    const doms = {};
    for (const x of fullDom.children) {
      if (x.tagName === "BLOCK") {
        const id = x.getAttribute("id");
        doms[id] = x;
      }
    }
    for (const block of topBlocks) {
      allBlocks.push(window.Blockly.Utils.getBlockDesc(block, doms));
    }
    blocksRef.current = allBlocks;
  }, [workspace]);

  const onClockOption = React.useCallback(
    (shiftKey: boolean, option) => {
      if (!vm.editingTarget.locked) {
        const xml = new XML();
        const x = xml.xmlDoc.firstChild as HTMLElement;

        if (option.option) {
          // We need to tweak the dropdown in this xml...
          const field = option.dom.querySelector(`field[name=${option.pickField}]`);
          if (field.getAttribute("id")) {
            field.innerText = option.option[0];
            field.setAttribute("id", `${option.option[1]}-${option.option[0]}`);
          } else {
            field.innerText = option.option[1]; // griffpatch - oops! option.option[1] not 0?
          }

          // Handle "stop other scripts in sprite"
          if (option.option[1] === "other scripts in sprite") {
            option.dom.querySelector("mutation").setAttribute("hasnext", "true");
          }
        }

        x.appendChild(option.dom);
        const ids = window.Blockly.Xml.domToWorkspace(x, workspace);
        const block = workspace.getBlockById(ids[0]);
        domHelpers.triggerDragAndDrop(block.svgPath_, null, { x: mouseXY.current.x, y: mouseXY.current.y }, shiftKey);

        searchInputRef.current.value = "";
        handleRecommend(block.type);
      }
    },
    [workspace, handleRecommend],
  );

  const filterBlock = React.useCallback(
    debounce((key) => {
      if (key) {
        const newOptions = fuzzySearch(key, blocksRef.current);
        updateOptions(newOptions.slice(0, DROPDOWN_BLOCK_LIST_MAX_ROWS));
      } else {
        updateOptions(blocksRef.current.slice(0, DROPDOWN_BLOCK_LIST_MAX_ROWS));
      }
    }, 100),
    [],
  );

  const onSearchInputChange = (e: React.ChangeEvent) => {
    const value = (e.target as HTMLInputElement).value;
    filterBlock(value);
  };

  const handleSizeChange = React.useCallback((value: ExpansionRect) => {
    containerInfoRef.current = value;
    setContainerInfo(value);
  }, []);

  const handleFocus = React.useCallback(() => {
    setFocused(true);
  }, []);

  const handleBlur = React.useCallback(() => {
    setFocused(false);
  }, []);

  React.useEffect(() => {
    optionRef.current = options;
  }, [options]);

  React.useEffect(() => {
    const workspaceDom = document.querySelector(".blocklySvg");
    const handlerMouseMove = (e: MouseEvent) => {
      mouseXY.current.x = e.clientX;
      mouseXY.current.y = e.clientY;
    };
    const updateWindowSize = () => {
      windowWH.current.h = window.innerHeight || document.documentElement.clientHeight;
      windowWH.current.w = window.innerWidth || document.documentElement.clientWidth;
    };
    const handleMouseEnter = () => {
      mouseInWorkspace.current = true;
    };
    const handleMouseLeave = () => {
      mouseInWorkspace.current = false;
    };
    updateWindowSize();
    window.addEventListener("mousemove", handlerMouseMove);
    window.addEventListener("resize", updateWindowSize);
    workspaceDom.addEventListener("mouseenter", handleMouseEnter);
    workspaceDom.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handlerMouseMove);
      window.removeEventListener("resize", updateWindowSize);
      workspaceDom.removeEventListener("mouseenter", handleMouseEnter);
      workspaceDom.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [shortcutKey]);

  React.useEffect(() => {
    if (shortcutKey.length) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (mouseInWorkspace.current && hotkeyIsDown(shortcutKey, e)) {
          e.preventDefault();
          setContainerInfo({
            ...containerInfoRef.current,
            ...getContainerPosition(),
          });
          setVisible((pre) => !pre);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [shortcutKey]);

  React.useEffect(() => {
    if (focused) {
      initializeBlocks();
      if (!defaultShowed.current) {
        defaultShowed.current = true;
        updateOptions(blocksRef.current.slice(0, DROPDOWN_BLOCK_LIST_MAX_ROWS));
      }
      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.keyCode) {
          case 40:
            handleSelectOption(Math.min(selectedOptionIndex.current + 1, optionRef.current.length - 1));
            break;
          case 38:
            handleSelectOption(Math.min(Math.max(selectedOptionIndex.current - 1, 0)));
            break;
          case 13:
            if (selectedOptionIndex.current >= 0) {
              const option = optionRef.current[selectedOptionIndex.current];
              if (option) {
                onClockOption(false, option);
              }
            }
            break;
          default:
            break;
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [focused]);

  React.useEffect(() => {
    if (visible) {
      defaultShowed.current = false;
      searchInputRef.current?.focus();
    } else {
      searchInputRef.current && (searchInputRef.current.value = "");
      handleSelectOption(-1);
    }
  }, [visible]);

  React.useEffect(() => {
    if (visible) {
      trackEvents.dispatch(trackEvents.USE_ADDON, {
        searchType: "new_blocks",
      });
      const heartbeat = trackEvents.heartbeatEvents(trackEvents.USING_ADDON_HEARTBEAT, {
        pluginType: "new_blocks",
      });
      return () => {
        heartbeat.dispose();
      };
    }
  }, [visible]);

  React.useEffect(() => {
    if (options) {
      blockListRef.current?.scrollTo(0, 0);
    }
  }, [options]);

  React.useEffect(() => {
    const register = registerSettings(intl.formatMessage(messages.title), "plugin-code-filter", [
      {
        key: "hotkeys",
        label: "快捷键",
        items: [
          {
            key: "visible",
            label: intl.formatMessage(messages.title),
            type: "hotkey",
            value: shortcutKey,
            onChange: (value: Array<string>) => {
              setShortcutKey(value);
            },
          },
        ],
      },
    ]);
    return () => {
      register.dispose();
    };
  }, [registerSettings]);

  React.useEffect(() => {
    const handler = (event) => {
      if (event.detail === false) {
        setVisible((pre) => {
          oldVisibleRef.current = pre ? true : null;
          return false;
        });
      } else if (event.detail === true && oldVisibleRef.current) {
        setVisible(true);
        oldVisibleRef.current = null;
      }
    };
    window.addEventListener("blocksTabVisibleChange", handler);
    return () => {
      window.removeEventListener("blocksTabVisibleChange", handler);
    };
  }, []);

  return (
    <React.Fragment>
      {ReactDOM.createPortal(
        <Tooltip
          className={styles.icon}
          icon={<CodeFilterIcon />}
          onClick={handleClick}
          tipText={hoverText}
          shortcutKey={transitionHotkeysToString(shortcutKey)}
        />,
        document.querySelector(".toolboxHeader") || document.body,
      )}
      {visible &&
        ReactDOM.createPortal(
          <ExpansionBox
            title={intl.formatMessage(messages.title)}
            id="plugin-code-filter"
            minWidth={300}
            minHeight={450}
            borderRadius={8}
            stayOnTop
            onClose={() => setVisible(false)}
            onSizeChange={handleSizeChange}
            containerInfo={containerInfo}
          >
            <div className={styles.containerBody}>
              <input
                ref={searchInputRef}
                type="search"
                id="codeSearchInput"
                placeholder={intl.formatMessage(messages.intro)}
                className={styles.searchInput}
                onChange={onSearchInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoComplete="off"
              />
              <ul className={styles.options} ref={blockListRef}>
                {options.map((item) => {
                  const { block, desc } = item;
                  const key = `${block.id} ${desc}`;
                  const { url, height } = window.Blockly.Utils.getBlockSvgImage(block, key);
                  if (!url) return null;
                  return (
                    <li key={key} onMouseDown={(e) => onClockOption(e.shiftKey, item)}>
                      <img src={url} style={{ height }} draggable="false" />
                    </li>
                  );
                })}
              </ul>
            </div>
          </ExpansionBox>,
          document.body,
        )}
    </React.Fragment>
  );
};

CodeFilter.displayName = "CodeFilterPlugin";

export default CodeFilter;
