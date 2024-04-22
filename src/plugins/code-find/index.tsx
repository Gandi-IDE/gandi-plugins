import * as React from "react";
import * as ReactDOM from "react-dom";
import { debounce } from "lodash-es";
import { defineMessages } from "@formatjs/intl";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import Tooltip from "components/Tooltip";
import scratchblocks from "gandiblocks";
import IF from "components/IF";
import { hotkeyIsDown, transitionHotkeysToString } from "utils/hotkey-helper";
import useStorageInfo from "hooks/useStorageInfo";
import { isMac } from "lib/client-info";
import zh_cn from "gandiblocks/locales/zh-cn.json"; // 中文
import BlocksKeywordsParser from "utils/blocks-keywords-parser";
import { scrollBlockIntoView } from "utils/block-helper";
import type { IntlShape } from "react-intl";

import CodeFindIcon from "assets/icon--code-find.svg";
import styles from "./styles.less";

scratchblocks.loadLanguages({ ["zh-cn"]: zh_cn });

interface BlockLiProps {
  data: Option;
  intl: IntlShape;
  onClick: (block: string) => void;
  onMouseEnterImage: React.MouseEventHandler<HTMLImageElement>;
  onMouseLeaveImage: React.MouseEventHandler<HTMLImageElement>;
}

interface TargetLiProps {
  target: TargetOption;
  intl: IntlShape;
  onClick: (targetId: string, block: string) => void;
  onMouseEnterImage: React.MouseEventHandler<HTMLImageElement>;
  onMouseLeaveImage: React.MouseEventHandler<HTMLImageElement>;
}

interface Option {
  scriptText: string;
  blockIds: Array<string>;
}

interface TargetOption {
  targetId: string;
  targetName: string;
  targetCostumeUrl: string;
  showBlocks: boolean;
  blocks: Array<{
    scriptText: string;
    blockIds: Array<string>;
  }>;
}

const messages = defineMessages({
  intro: {
    id: "plugins.codeFind.intro",
    defaultMessage: "Find block in project",
    description: "Find block in project",
  },
  noResult: {
    id: "plugins.codeFind.noResult",
    defaultMessage: "No result",
    description: "No result",
  },
  title: {
    id: "plugins.codeFind.title",
    defaultMessage: "Find Blocks",
    description: "Find Blocks",
  },
  loadMore: {
    id: "plugins.codeFind.loadMore",
    defaultMessage: "See More",
    description: "See More",
  },
});

// 下拉列表每一页的个数
const DROPDOWN_BLOCK_PAGE_SIZE = 20;

const DEFAULT_SETTINGS = {
  hotkeys: {
    visible: {
      keys: ["ctrlKey", "F"],
      stringKeys: [isMac ? "Command" : "Ctrl", "F"],
    },
  },
};

const DEFAULT_CONTAINER_INFO = {
  width: 300,
  height: 450,
  translateX: 72,
  translateY: 60,
};

const BlockLi: React.FC<BlockLiProps> = ({ data, intl, onClick, onMouseEnterImage, onMouseLeaveImage }) => {
  const { scriptText, blockIds } = data;  
  const [current, setCurrent] = React.useState(1);
  const ref = React.useRef(null);

  const handleClickLast = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = current - 1 > 0 ? current - 1 : blockIds.length;
    setCurrent(idx);
    onClick(blockIds[idx - 1]);
  };

  const handleClickNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = current + 1 > blockIds.length ? 1 : current + 1;
    setCurrent(idx);
    onClick(blockIds[idx - 1]);
  };

  React.useEffect(() => {
    const options = {
      languages: [intl.locale],
      style: "scratch3",
      scale: 0.65,
    };
    const doc = scratchblocks.parse(scriptText, options);
    const svg = scratchblocks.render(doc, options);
    ref.current.innerHTML = "";
    ref.current.appendChild(svg);
  }, [scriptText]);

  return (
    <li
      onClick={(e) => {
        e.stopPropagation();
        onClick(blockIds[current - 1]);
      }}
    >
      <div className={styles.blockImageWrapper}>
        <div
          ref={ref}
          style={{ width: "fit-content" }}
          onMouseEnter={onMouseEnterImage}
          onMouseLeave={onMouseLeaveImage}
        />
      </div>
      <div className={styles.capsule}>
        <span className={styles.lastIcon} onClick={handleClickLast}>
          <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1.29167 5L6.5 8.125L6.5 1.875L1.29167 5Z"
              fill="white"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className={styles.currentNumber}>{`${current}/${blockIds.length}`}</span>
        <span className={styles.totalNumber}>{blockIds.length}</span>
        <span className={styles.nextIcon} onClick={handleClickNext}>
          <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.70833 5L1.5 1.875V8.125L6.70833 5Z"
              fill="white"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </li>
  );
};

const TargetLi: React.FC<TargetLiProps> = ({ target, intl, onClick, onMouseEnterImage, onMouseLeaveImage }) => {
  const { targetId, targetName, targetCostumeUrl, showBlocks, blocks } = target;
  const [visible, setVisible] = React.useState(showBlocks);
  const [length, setLength] = React.useState(showBlocks ? DROPDOWN_BLOCK_PAGE_SIZE : 0);

  const handleTrigger = () => {
    if (length === 0) {
      setLength(DROPDOWN_BLOCK_PAGE_SIZE);
    }
    setVisible(!visible);
  };

  return (
    <li className={styles.targetOptionLi}>
      <div className={styles.targetInfo} onClick={handleTrigger}>
        <div className={styles.targetInfoLeft}>
          <span className={styles.triangle} style={{ transform: visible ? "rotate(90deg)" : "" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4.66943 3.32812L7.3361 5.99479L4.66943 8.66146"
                stroke="#D1D5DB"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className={styles.spriteImage}>
            <span
              className={styles.spriteImageInner}
              style={{
                backgroundImage: `url(${targetCostumeUrl})`,
              }}
            />
          </span>
          <span>{targetName}</span>
        </div>
        <div className={styles.targetBlocksCount}>
          <span className={styles.totalNumber}>{blocks.length}</span>
        </div>
      </div>
      <ul className={styles.options} style={{ display: visible ? "" : "none" }}>
        {blocks.slice(0, length).map((block) => (
          <BlockLi
            key={block.scriptText}
            intl={intl}
            data={block}
            onClick={(blockId) => onClick(targetId, blockId)}
            onMouseEnterImage={onMouseEnterImage}
            onMouseLeaveImage={onMouseLeaveImage}
          />
        ))}
        {blocks.length > length && (
          <button className={styles.loadMore} onClick={() => setLength(length + DROPDOWN_BLOCK_PAGE_SIZE)}>
            {intl.formatMessage(messages.loadMore)}
          </button>
        )}
      </ul>
    </li>
  );
};

const CodeFind: React.FC<PluginContext> = ({ workspace, vm, intl, registerSettings, trackEvents }) => {
  const [keyword, setKeyword] = React.useState("");
  const [allOptions, setAllOptions] = React.useState<TargetOption[]>([]);
  const [visible, setVisible] = React.useState(false);
  const [shortcutKey, setShortcutKey] = React.useState(DEFAULT_SETTINGS.hotkeys.visible);
  const [containerInfo, setContainerInfo] = useStorageInfo(
    "WORKSPACE_BLOCKS_SEARCH_CONTAINER_INFO",
    DEFAULT_CONTAINER_INFO,
  );

  const blocksKeywordsParser = React.useRef<BlocksKeywordsParser>(null);
  const oldVisibleRef = React.useRef(null);
  const rootRef = React.useRef(null);
  const searchInputRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const previewBlockIdRef = React.useRef<string>(null);
  const containerInfoRef = React.useRef(containerInfo);
  const viewBlockContainerRef = React.useRef<HTMLDivElement>(null);

  const getBaseData = React.useCallback(() => {
    const optionList = [];
    const targets = [...vm.runtime.targets];
    const editingTargetId = vm.editingTarget.id;
    for (let index = 0; index < targets.length; index++) {
      const target = targets[index];
      if (target.isOriginal) {
        const blocksKeywords = blocksKeywordsParser.current.processor(target.blocks._blocks);
        optionList.push({
          targetId: target.id,
          targetName: target.sprite.name,
          targetCostumeUrl: workspace.getTargetCostumeData(target.getCostumes()[target.currentCostume].asset),
          showBlocks: editingTargetId === target.id ? true : false,
          blocksKeywords,
        });
      }
    }
    return optionList;
  }, [workspace, vm]);

  const onMouseLeaveImage = React.useCallback(() => {
    viewBlockContainerRef.current.style.display = "none";
    viewBlockContainerRef.current.style.top = "";
    viewBlockContainerRef.current.innerHTML = "";
  }, []);

  const filterBlock = React.useCallback(
    debounce((key: string) => {
      onMouseLeaveImage();
      if (key) {
        const data = getBaseData();
        const newOptions: TargetOption[] = [];
        for (let i = 0; i < data.length; i++) {
          const { targetId, targetName, targetCostumeUrl, showBlocks, blocksKeywords } = data[i];
          const blocks = new Map<string, { scriptText: string; blockIds: string[] }>();
          const keysReg = key.split(" ").map((key) => new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
          for (let b = 0; b < blocksKeywords.length; b++) {
            const [id, scriptText, keywordText] = blocksKeywords[b];
            if (keysReg.every((i) => i.test(keywordText))) {
              if (blocks.get(keywordText)) {
                blocks.get(keywordText).blockIds.push(id);
              } else {
                blocks.set(keywordText, {
                  scriptText,
                  blockIds: [id],
                });
              }
            }
          }
          if (blocks.size) {
            newOptions.push({
              targetId,
              targetName,
              targetCostumeUrl,
              showBlocks,
              blocks: [...blocks.values()],
            });
          }
        }
        setAllOptions(newOptions);
      } else {
        setAllOptions([]);
      }
    }, 300),
    [getBaseData],
  );

  const getContainerPosition = React.useCallback(() => {
    const { x, y } = rootRef.current.getBoundingClientRect();
    return {
      translateX: x - containerInfoRef.current.width - 10,
      translateY: y - 6,
    };
  }, []);

  const handleShow = React.useCallback(() => {
    setContainerInfo({
      ...containerInfoRef.current,
      ...getContainerPosition(),
    });
    setVisible(true);
  }, []);

  const handleClose = React.useCallback(() => {
    setVisible(false);
  }, []);

  const onSearchInputChange = (e: React.ChangeEvent) => {
    const value = (e.target as HTMLInputElement).value;
    setKeyword(value);
    filterBlock(value);
  };

  const onClickOption = React.useCallback(
    (targetId: string, blockId: string) => {
      if (vm.editingTarget && targetId === vm.editingTarget.id) {
        scrollBlockIntoView(workspace.blockDB_[blockId], workspace);
      } else {
        previewBlockIdRef.current = blockId;
        vm.setEditingTarget(targetId);
      }
    },
    [vm, workspace],
  );

  const onMouseEnterImage = React.useCallback((e: React.MouseEvent) => {
    viewBlockContainerRef.current.innerHTML = "";

    const target = e.target as HTMLImageElement;
    const rect = target.getBoundingClientRect();
    const containerTarget = containerRef.current.container;
    const containerRect = containerTarget.getBoundingClientRect();

    const maxWidth = Math.min(containerRect.x - 90, rect.width);
    const scale = maxWidth / rect.width;

    const blockImage = target.cloneNode(true) as HTMLDivElement;
    blockImage.style.transform = "scale(" + scale + ")";
    blockImage.style.transformOrigin = "left top";

    viewBlockContainerRef.current.appendChild(blockImage);
    viewBlockContainerRef.current.style.display = "block";
    viewBlockContainerRef.current.style.width = maxWidth + 24 + "px";
    viewBlockContainerRef.current.style.height = `${rect.height * scale + 24}px`;
    viewBlockContainerRef.current.style.top = `${rect.y - containerRect.y - 13}px`;
  }, []);

  const handleSizeChange = React.useCallback((value: ExpansionRect) => {
    containerInfoRef.current = value;
    setContainerInfo(value);
  }, []);

  React.useEffect(() => {
    blocksKeywordsParser.current = new BlocksKeywordsParser(workspace);
  }, [workspace]);

  React.useEffect(() => {
    if (visible) {
      searchInputRef.current.focus();
    } else {
      setKeyword("");
      setAllOptions([]);
    }
  }, [visible]);

  React.useEffect(() => {
    if (visible) {
      trackEvents.dispatch(trackEvents.USE_ADDON, {
        searchType: "used_blocks",
      });
      const heartbeat = trackEvents.heartbeatEvents(trackEvents.USING_ADDON_HEARTBEAT, {
        pluginType: "used_blocks",
      });
      return () => {
        heartbeat.dispose();
      };
    }
  }, [visible]);

  React.useEffect(() => {
    const handleTargetUpdate = () => {
      if (previewBlockIdRef.current) {
        const handler = () => {
          const block = workspace.blockDB_[previewBlockIdRef.current];
          if (block) {
            previewBlockIdRef.current = null;
            scrollBlockIntoView(block, workspace);
          } else {
            requestAnimationFrame(handler);
          }
        };
        requestAnimationFrame(handler);
      }
    };
    vm.on("targetsUpdate", handleTargetUpdate);
    return () => {
      vm.off("targetsUpdate", handleTargetUpdate);
    };
  }, [vm, workspace]);

  React.useEffect(() => {
    if (shortcutKey.keys.length) {
      const handler = (e: KeyboardEvent) => {
        if (!rootRef.current.getBoundingClientRect().x) return;
        if (hotkeyIsDown(shortcutKey.keys, e)) {
          e.preventDefault();
          setContainerInfo({
            ...containerInfoRef.current,
            ...getContainerPosition(),
          });
          setVisible((pre) => !pre);
        }
      };
      window.addEventListener("keydown", handler);
      return () => {
        window.removeEventListener("keydown", handler);
      };
    }
  }, [shortcutKey]);

  React.useEffect(() => {
    const register = registerSettings(intl.formatMessage(messages.title), "plugin-code-find", [
      {
        key: "hotkeys",
        label: "快捷键",
        items: [
          {
            key: "visible",
            type: "hotkey",
            label: intl.formatMessage(messages.title),
            value: shortcutKey,
            onChange: (value) => {
              setShortcutKey(
                value as {
                  keys: string[];
                  stringKeys: string[];
                },
              );
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
  }, [handleClose]);

  return ReactDOM.createPortal(
    <section className={styles.workspaceBlocksSearchContainer} ref={rootRef}>
      <Tooltip
        className={styles.searchIcon}
        icon={<CodeFindIcon />}
        onClick={handleShow}
        tipText={intl.formatMessage(messages.intro)}
        shortcutKey={transitionHotkeysToString(shortcutKey.keys)}
      />
      {visible &&
        ReactDOM.createPortal(
          <ExpansionBox
            ref={containerRef}
            stayOnTop
            title={intl.formatMessage(messages.title)}
            id="plugin-blocks-search"
            minWidth={300}
            minHeight={450}
            borderRadius={8}
            onClose={handleClose}
            onSizeChange={handleSizeChange}
            containerInfo={containerInfo}
          >
            <div className={styles.containerBody}>
              <input
                ref={searchInputRef}
                id="workspaceBlocksSearchInput"
                type="search"
                value={keyword}
                placeholder={intl.formatMessage(messages.intro)}
                className={styles.searchInput}
                onChange={onSearchInputChange}
                autoComplete="off"
              />
              <div className={styles.searchResult}>
                {allOptions.length
                  ? intl.formatMessage(
                      {
                        id: "plugins.codeFind.searchResult",
                        defaultMessage: "{result} results",
                        description: "Search result",
                      },
                      {
                        result: allOptions.reduce((a, i) => a + i.blocks.length, 0),
                      },
                    )
                  : intl.formatMessage(messages.noResult)}
              </div>
              <IF condition={!allOptions.length} forceRender>
                <img className={styles.noFound} src="https://m.xiguacity.cn/scratch/no-found.png" />
              </IF>
              <ul className={styles.options}>
                {allOptions.map((item) => (
                  <TargetLi
                    key={item.targetId}
                    intl={intl}
                    target={item}
                    onClick={onClickOption}
                    onMouseEnterImage={onMouseEnterImage}
                    onMouseLeaveImage={onMouseLeaveImage}
                  />
                ))}
              </ul>
              <div ref={viewBlockContainerRef} className={styles.viewBlockContainer} />
            </div>
          </ExpansionBox>,
          document.body,
        )}
    </section>,
    document.querySelector(".plugins-wrapper"),
  );
};

CodeFind.displayName = "CodeFindPlugin";

export default CodeFind;
