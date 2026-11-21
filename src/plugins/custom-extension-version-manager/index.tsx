import * as React from "react";
import * as ReactDOM from "react-dom";
import toast, { Toaster } from "react-hot-toast";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import Tooltip from "components/Tooltip";
import useStorageInfo from "hooks/useStorageInfo";
import ExtensionVersionIcon from "assets/icon--extension-version.svg";
import { scrollBlockIntoView } from "utils/block-helper";
import { fetchMarketplaceExtension, getMarketplacePageUrl, MarketplaceRequestError } from "./marketplace";
import {
  getLoadedCustomExtensions,
  inspectCustomExtensionVersionCompatibility,
  switchCustomExtensionVersion,
} from "./runtime";
import {
  ExtensionCompatibilityReport,
  ExtensionVersion,
  IncompatibleBlockUsage,
  ManagedCustomExtension,
  MarketplaceExtensionDetail,
} from "./types";
import styles from "./styles.less";

const DEFAULT_CONTAINER_INFO: ExpansionRect = {
  width: 460,
  height: 540,
  translateX: 72,
  translateY: 60,
};

const formatReleasedAt = (value: string | number | undefined, locale: string) => {
  if (value === undefined || value === null || value === "") return "";
  const numericValue = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  const date = new Date(numericValue);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

type CompatibilityWarningState = {
  version: ExtensionVersion;
  report: ExtensionCompatibilityReport;
};

const CustomExtensionVersionManager: React.FC<PluginContext> = ({ vm, workspace, intl, msg, registerSettings }) => {
  const [visible, setVisible] = React.useState(false);
  const [containerInfo, setContainerInfo] = useStorageInfo(
    "CUSTOM_EXTENSION_VERSION_MANAGER_CONTAINER_INFO",
    DEFAULT_CONTAINER_INFO,
  );
  const [extensions, setExtensions] = React.useState<ManagedCustomExtension[]>([]);
  const [selectedExtensionId, setSelectedExtensionId] = React.useState("");
  const [marketplaceDetail, setMarketplaceDetail] = React.useState<MarketplaceExtensionDetail | null>(null);
  const [marketplaceError, setMarketplaceError] = React.useState("");
  const [loadingVersions, setLoadingVersions] = React.useState(false);
  const [checkingVersionId, setCheckingVersionId] = React.useState("");
  const [switchingVersionId, setSwitchingVersionId] = React.useState("");
  const [compatibilityWarning, setCompatibilityWarning] = React.useState<CompatibilityWarningState | null>(null);
  const [compatibilityModalVisible, setCompatibilityModalVisible] = React.useState(false);

  const rootRef = React.useRef<HTMLElement>(null);
  const containerInfoRef = React.useRef(containerInfo);
  const marketplaceRequestRef = React.useRef<AbortController | null>(null);
  const pendingBlockRef = React.useRef<IncompatibleBlockUsage | null>(null);

  const selectedExtension = extensions.find((extension) => extension.id === selectedExtensionId) || null;
  const versions = marketplaceDetail?.eid === selectedExtensionId ? marketplaceDetail.versions : [];

  const refreshExtensions = React.useCallback(() => {
    const nextExtensions = getLoadedCustomExtensions(vm);
    setExtensions(nextExtensions);
    setSelectedExtensionId((current) => {
      if (current && nextExtensions.some((extension) => extension.id === current)) return current;
      return nextExtensions[0]?.id || "";
    });
  }, [vm]);

  const formatSwitchError = React.useCallback(
    (error: unknown) => {
      const typedError = error as Error & {
        cause?: { code?: string; values?: string[] };
        expectedId?: string;
        loadedIds?: string[];
      };
      const values = typedError.cause?.values?.join(", ") || "";

      if (typedError.message === "EXTENSION_ID_MISMATCH") {
        return intl.formatMessage(
          { id: "plugins.customExtensionVersionManager.error.idMismatch" },
          {
            expected: typedError.expectedId || selectedExtensionId,
            actual: typedError.loadedIds?.join(", ") || msg("plugins.customExtensionVersionManager.unknown"),
          },
        );
      }
      if (typedError.cause?.code === "OPCODE_NOT_FOUND") {
        return intl.formatMessage(
          { id: "plugins.customExtensionVersionManager.error.missingOpcodes" },
          { opcodes: values },
        );
      }
      if (typedError.cause?.code === "BLOCK_TYPE_CHANGED") {
        return intl.formatMessage(
          { id: "plugins.customExtensionVersionManager.error.blockTypeChanged" },
          { opcodes: values },
        );
      }
      return typedError.message || msg("plugins.customExtensionVersionManager.switchFailed");
    },
    [intl, msg, selectedExtensionId],
  );

  const formatMarketplaceError = React.useCallback(
    (error: unknown, extensionId: string) => {
      if (error instanceof MarketplaceRequestError) {
        if (error.status === 404) {
          return intl.formatMessage(
            { id: "plugins.customExtensionVersionManager.marketplaceNotFound" },
            { id: extensionId },
          );
        }
        if (error.code === "INVALID_RESPONSE") {
          return msg("plugins.customExtensionVersionManager.marketplaceInvalidResponse");
        }
      }
      return msg("plugins.customExtensionVersionManager.marketplaceLoadFailed");
    },
    [intl, msg],
  );

  const loadMarketplaceVersions = React.useCallback(
    async (extensionId: string) => {
      marketplaceRequestRef.current?.abort();
      if (!extensionId) {
        setMarketplaceDetail(null);
        setMarketplaceError("");
        setLoadingVersions(false);
        return;
      }

      const controller = new AbortController();
      marketplaceRequestRef.current = controller;
      setMarketplaceDetail(null);
      setMarketplaceError("");
      setLoadingVersions(true);

      try {
        const detail = await fetchMarketplaceExtension(extensionId, controller.signal);
        if (!controller.signal.aborted) setMarketplaceDetail(detail);
      } catch (error) {
        if (!controller.signal.aborted) setMarketplaceError(formatMarketplaceError(error, extensionId));
      } finally {
        if (marketplaceRequestRef.current === controller) {
          marketplaceRequestRef.current = null;
          setLoadingVersions(false);
        }
      }
    },
    [formatMarketplaceError],
  );

  const performVersionSwitch = React.useCallback(
    async (version: ExtensionVersion, extensionId: string, force = false) => {
      try {
        await switchCustomExtensionVersion(vm, workspace, extensionId, version.url, force);
        refreshExtensions();
        toast.success(
          intl.formatMessage({ id: "plugins.customExtensionVersionManager.switchSuccess" }, { version: version.label }),
        );
        return true;
      } catch (error) {
        refreshExtensions();
        setTimeout(refreshExtensions, 0);
        toast.error(formatSwitchError(error), { duration: 7000 });
        return false;
      }
    },
    [formatSwitchError, intl, refreshExtensions, vm, workspace],
  );

  const switchVersion = React.useCallback(
    async (version: ExtensionVersion) => {
      if (!selectedExtension || checkingVersionId || switchingVersionId) return;
      const extensionId = selectedExtension.id;
      setCheckingVersionId(version.id);
      try {
        const report = await inspectCustomExtensionVersionCompatibility(vm, extensionId, version.url);
        refreshExtensions();
        setTimeout(refreshExtensions, 0);
        if (report.issues.length > 0) {
          setCompatibilityWarning({ version, report });
          setCompatibilityModalVisible(true);
          return;
        }

        setCheckingVersionId("");
        setSwitchingVersionId(version.id);
        await performVersionSwitch(version, extensionId);
      } catch (error) {
        refreshExtensions();
        setTimeout(refreshExtensions, 0);
        toast.error(formatSwitchError(error), { duration: 7000 });
      } finally {
        setCheckingVersionId("");
        setSwitchingVersionId("");
      }
    },
    [
      checkingVersionId,
      formatSwitchError,
      performVersionSwitch,
      refreshExtensions,
      selectedExtension,
      switchingVersionId,
      vm,
    ],
  );

  const forceSwitchVersion = React.useCallback(async () => {
    if (!compatibilityWarning || switchingVersionId) return;
    const { version, report } = compatibilityWarning;
    setCompatibilityModalVisible(false);
    setCheckingVersionId("");
    setSwitchingVersionId(version.id);
    try {
      const switched = await performVersionSwitch(version, report.extensionId, true);
      if (switched) setCompatibilityWarning(null);
    } finally {
      setSwitchingVersionId("");
    }
  }, [compatibilityWarning, performVersionSwitch, switchingVersionId]);

  const revealPendingBlock = React.useCallback(() => {
    if (!pendingBlockRef.current) return;
    let attempts = 0;
    const reveal = () => {
      const pendingBlock = pendingBlockRef.current;
      if (!pendingBlock) return;
      const block = workspace.blockDB_[pendingBlock.blockId] || workspace.getBlockById(pendingBlock.blockId);
      if (block) {
        pendingBlockRef.current = null;
        scrollBlockIntoView(block, workspace);
        return;
      }
      attempts += 1;
      if (attempts < 60) {
        requestAnimationFrame(reveal);
      } else {
        pendingBlockRef.current = null;
      }
    };
    requestAnimationFrame(reveal);
  }, [workspace]);

  const jumpToIncompatibleBlock = React.useCallback(
    (issue: IncompatibleBlockUsage) => {
      setCompatibilityModalVisible(false);
      pendingBlockRef.current = issue;
      if (vm.editingTarget?.id === issue.targetId) {
        revealPendingBlock();
      } else {
        vm.setEditingTarget(issue.targetId);
      }
    },
    [revealPendingBlock, vm],
  );

  const getContainerPosition = React.useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return {};
    return {
      translateX: rect.x - containerInfoRef.current.width - 10,
      translateY: rect.y - 6,
    };
  }, []);

  const handleShow = React.useCallback(() => {
    refreshExtensions();
    setContainerInfo({
      ...containerInfoRef.current,
      ...getContainerPosition(),
    });
    setVisible(true);
  }, [getContainerPosition, refreshExtensions, setContainerInfo]);

  const handleSizeChange = React.useCallback(
    (value: ExpansionRect) => {
      containerInfoRef.current = value;
      setContainerInfo(value);
    },
    [setContainerInfo],
  );

  React.useEffect(() => {
    const register = registerSettings(
      msg("plugins.customExtensionVersionManager.title"),
      "plugin-custom-extension-version-manager",
      [
        {
          key: "marketplaceVersions",
          label: msg("plugins.customExtensionVersionManager.title"),
          description: msg("plugins.customExtensionVersionManager.description"),
          items: [],
        },
      ],
      <ExtensionVersionIcon />,
    );
    return () => register.dispose();
  }, [msg, registerSettings]);

  React.useEffect(() => {
    refreshExtensions();
    const handleRuntimeChange = () => refreshExtensions();
    vm.on("PROJECT_LOADED", handleRuntimeChange);
    vm.runtime.on("EXTENSION_LIBRARY_UPDATED", handleRuntimeChange);
    vm.runtime.on("GANDI_WILD_EXTENSIONS_CHANGED", handleRuntimeChange);
    return () => {
      vm.off("PROJECT_LOADED", handleRuntimeChange);
      vm.runtime.off("EXTENSION_LIBRARY_UPDATED", handleRuntimeChange);
      vm.runtime.off("GANDI_WILD_EXTENSIONS_CHANGED", handleRuntimeChange);
    };
  }, [refreshExtensions, vm]);

  React.useEffect(() => {
    const handleTargetUpdate = () => revealPendingBlock();
    vm.on("targetsUpdate", handleTargetUpdate);
    return () => {
      vm.off("targetsUpdate", handleTargetUpdate);
    };
  }, [revealPendingBlock, vm]);

  React.useEffect(() => {
    if (!visible) return;
    void loadMarketplaceVersions(selectedExtensionId);
  }, [loadMarketplaceVersions, selectedExtensionId, visible]);

  React.useEffect(
    () => () => {
      marketplaceRequestRef.current?.abort();
    },
    [],
  );

  const toolbarHost = document.querySelector(".plugins-wrapper") || document.body;

  return ReactDOM.createPortal(
    <section className={styles.plugin} ref={rootRef}>
      <Toaster />
      <Tooltip
        className={styles.pluginIcon}
        icon={<ExtensionVersionIcon />}
        onClick={handleShow}
        tipText={msg("plugins.customExtensionVersionManager.title")}
      />

      {visible &&
        ReactDOM.createPortal(
          <ExpansionBox
            stayOnTop
            title={msg("plugins.customExtensionVersionManager.title")}
            id="plugin-custom-extension-version-manager"
            minWidth={400}
            minHeight={460}
            borderRadius={8}
            onClose={() => {
              setVisible(false);
              setCompatibilityWarning(null);
              setCompatibilityModalVisible(false);
            }}
            onSizeChange={handleSizeChange}
            containerInfo={containerInfo}
          >
            <div className={styles.panelBody}>
              <div className={styles.toolbar}>
                <label className={styles.fieldLabel} htmlFor="custom-extension-version-manager-extension">
                  {msg("plugins.customExtensionVersionManager.extension")}
                </label>
                <div className={styles.toolbarRow}>
                  <select
                    id="custom-extension-version-manager-extension"
                    className={styles.select}
                    value={selectedExtensionId}
                    onChange={(event) => {
                      setSelectedExtensionId(event.target.value);
                      setCompatibilityWarning(null);
                      setCompatibilityModalVisible(false);
                    }}
                    disabled={extensions.length === 0}
                  >
                    {extensions.length === 0 ? (
                      <option value="">{msg("plugins.customExtensionVersionManager.noExtensions")}</option>
                    ) : (
                      extensions.map((extension) => (
                        <option value={extension.id} key={extension.id}>
                          {extension.name} ({extension.id})
                        </option>
                      ))
                    )}
                  </select>
                  <button className={styles.secondaryButton} type="button" onClick={refreshExtensions}>
                    {msg("plugins.customExtensionVersionManager.refreshExtensions")}
                  </button>
                </div>
              </div>

              {selectedExtension ? (
                <>
                  <div className={styles.currentCard}>
                    <div className={styles.currentHeader}>
                      <div>
                        <strong>{selectedExtension.name}</strong>
                        <span className={styles.extensionId}>{selectedExtension.id}</span>
                      </div>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        disabled={loadingVersions}
                        onClick={() => void loadMarketplaceVersions(selectedExtension.id)}
                      >
                        {loadingVersions
                          ? msg("plugins.customExtensionVersionManager.loadingVersions")
                          : msg("plugins.customExtensionVersionManager.refreshVersions")}
                      </button>
                    </div>
                    <span className={styles.fieldLabel}>{msg("plugins.customExtensionVersionManager.currentUrl")}</span>
                    <code className={styles.urlText} title={selectedExtension.currentUrl}>
                      {selectedExtension.currentUrl || msg("plugins.customExtensionVersionManager.noCurrentUrl")}
                    </code>
                    <a
                      className={styles.marketplaceLink}
                      href={getMarketplacePageUrl(selectedExtension.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {msg("plugins.customExtensionVersionManager.openMarketplace")}
                    </a>
                  </div>

                  {compatibilityWarning ? (
                    <>
                      <div className={styles.listHeader}>
                        <strong>{msg("plugins.customExtensionVersionManager.compatibilityWarningTitle")}</strong>
                        <button
                          className={styles.secondaryButton}
                          type="button"
                          onClick={() => {
                            setCompatibilityWarning(null);
                            setCompatibilityModalVisible(false);
                          }}
                        >
                          {msg("plugins.customExtensionVersionManager.backToVersions")}
                        </button>
                      </div>
                      <p className={styles.modalHint}>
                        {intl.formatMessage(
                          { id: "plugins.customExtensionVersionManager.compatibilityWarningDescription" },
                          {
                            version: compatibilityWarning.version.label,
                            count: compatibilityWarning.report.issues.length,
                          },
                        )}
                      </p>
                      <div className={styles.issueList}>
                        {compatibilityWarning.report.issues.map((issue, index) => (
                          <button
                            className={styles.issueItem}
                            type="button"
                            key={`${issue.targetId}-${issue.blockId}-${index}`}
                            onClick={() => jumpToIncompatibleBlock(issue)}
                          >
                            <span className={styles.issueMain}>
                              <strong>{issue.label}</strong>
                              <code>{`${compatibilityWarning.report.extensionId}_${issue.opcode}`}</code>
                            </span>
                            <span className={styles.issueLocation}>
                              {intl.formatMessage(
                                { id: "plugins.customExtensionVersionManager.incompatibleBlockLocation" },
                                { target: issue.targetName },
                              )}
                            </span>
                            <span className={styles.issueReason}>
                              {issue.reason === "missing"
                                ? msg("plugins.customExtensionVersionManager.incompatibleBlockMissing")
                                : issue.reason === "hidden"
                                  ? msg("plugins.customExtensionVersionManager.incompatibleBlockHidden")
                                  : intl.formatMessage(
                                      { id: "plugins.customExtensionVersionManager.incompatibleBlockTypeChanged" },
                                      {
                                        from: issue.blockType || msg("plugins.customExtensionVersionManager.unknown"),
                                        to:
                                          issue.targetBlockType || msg("plugins.customExtensionVersionManager.unknown"),
                                      },
                                    )}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className={styles.modalActions}>
                        <button className={styles.dangerButton} type="button" onClick={() => void forceSwitchVersion()}>
                          {msg("plugins.customExtensionVersionManager.forceSwitch")}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.listHeader}>
                        <strong>{msg("plugins.customExtensionVersionManager.versionList")}</strong>
                        <span>{versions.length}</span>
                      </div>
                      <div className={styles.versionList}>
                        {loadingVersions ? (
                          <div className={styles.empty}>
                            {msg("plugins.customExtensionVersionManager.loadingVersions")}
                          </div>
                        ) : marketplaceError ? (
                          <div className={styles.errorState}>
                            <span>{marketplaceError}</span>
                            <button
                              className={styles.secondaryButton}
                              type="button"
                              onClick={() => void loadMarketplaceVersions(selectedExtension.id)}
                            >
                              {msg("plugins.customExtensionVersionManager.retry")}
                            </button>
                          </div>
                        ) : versions.length === 0 ? (
                          <div className={styles.empty}>{msg("plugins.customExtensionVersionManager.noVersions")}</div>
                        ) : (
                          versions.map((version) => {
                            const isCurrent = version.url === selectedExtension.currentUrl;
                            const isChecking = checkingVersionId === version.id;
                            const isSwitching = switchingVersionId === version.id;
                            const releasedAt = formatReleasedAt(version.releasedAt, intl.locale);
                            return (
                              <article className={styles.versionCard} key={`${version.id}-${version.url}`}>
                                <div className={styles.versionMain}>
                                  <div className={styles.versionTitleRow}>
                                    <strong>{version.label}</strong>
                                    {isCurrent && (
                                      <span className={styles.currentBadge}>
                                        {msg("plugins.customExtensionVersionManager.current")}
                                      </span>
                                    )}
                                    {version.releaseTags.map((tag) => (
                                      <span className={styles.releaseTag} key={tag}>
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  <code className={styles.versionUrl} title={version.url}>
                                    {version.url}
                                  </code>
                                  {releasedAt && <time className={styles.versionDate}>{releasedAt}</time>}
                                  {version.changelog && (
                                    <p className={styles.versionChangelog} title={version.changelog}>
                                      {version.changelog}
                                    </p>
                                  )}
                                </div>
                                <div className={styles.versionActions}>
                                  <button
                                    className={styles.primaryButton}
                                    type="button"
                                    disabled={isCurrent || Boolean(checkingVersionId) || Boolean(switchingVersionId)}
                                    onClick={() => void switchVersion(version)}
                                  >
                                    {isChecking
                                      ? msg("plugins.customExtensionVersionManager.checkingCompatibility")
                                      : isSwitching
                                        ? msg("plugins.customExtensionVersionManager.switching")
                                        : msg("plugins.customExtensionVersionManager.switch")}
                                  </button>
                                </div>
                              </article>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className={styles.empty}>{msg("plugins.customExtensionVersionManager.emptyHint")}</div>
              )}
            </div>
          </ExpansionBox>,
          document.body,
        )}

      {compatibilityWarning &&
        compatibilityModalVisible &&
        ReactDOM.createPortal(
          <div
            className={styles.modalBackdrop}
            onMouseDown={() => setCompatibilityModalVisible(false)}
            role="presentation"
          >
            <div
              className={styles.compatibilityModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="custom-extension-version-compatibility-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <span className={styles.warningIcon}>!</span>
                <div>
                  <h2 id="custom-extension-version-compatibility-title">
                    {msg("plugins.customExtensionVersionManager.compatibilityWarningTitle")}
                  </h2>
                  <p>
                    {intl.formatMessage(
                      { id: "plugins.customExtensionVersionManager.compatibilityWarningDescription" },
                      {
                        version: compatibilityWarning.version.label,
                        count: compatibilityWarning.report.issues.length,
                      },
                    )}
                  </p>
                </div>
              </div>
              <p className={styles.modalHint}>
                {msg("plugins.customExtensionVersionManager.compatibilityWarningHint")}
              </p>
              <div className={styles.issueList}>
                {compatibilityWarning.report.issues.map((issue, index) => (
                  <button
                    className={styles.issueItem}
                    type="button"
                    key={`${issue.targetId}-${issue.blockId}-${index}`}
                    onClick={() => jumpToIncompatibleBlock(issue)}
                  >
                    <span className={styles.issueMain}>
                      <strong>{issue.label}</strong>
                      <code>{`${compatibilityWarning.report.extensionId}_${issue.opcode}`}</code>
                    </span>
                    <span className={styles.issueLocation}>
                      {intl.formatMessage(
                        { id: "plugins.customExtensionVersionManager.incompatibleBlockLocation" },
                        { target: issue.targetName },
                      )}
                    </span>
                    <span className={styles.issueReason}>
                      {issue.reason === "missing"
                        ? msg("plugins.customExtensionVersionManager.incompatibleBlockMissing")
                        : issue.reason === "hidden"
                          ? msg("plugins.customExtensionVersionManager.incompatibleBlockHidden")
                          : intl.formatMessage(
                              { id: "plugins.customExtensionVersionManager.incompatibleBlockTypeChanged" },
                              {
                                from: issue.blockType || msg("plugins.customExtensionVersionManager.unknown"),
                                to: issue.targetBlockType || msg("plugins.customExtensionVersionManager.unknown"),
                              },
                            )}
                    </span>
                  </button>
                ))}
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setCompatibilityModalVisible(false)}
                >
                  {msg("plugins.customExtensionVersionManager.cancel")}
                </button>
                <button className={styles.dangerButton} type="button" onClick={() => void forceSwitchVersion()}>
                  {msg("plugins.customExtensionVersionManager.forceSwitch")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>,
    toolbarHost,
  );
};

CustomExtensionVersionManager.displayName = "CustomExtensionVersionManager";

export default CustomExtensionVersionManager;
