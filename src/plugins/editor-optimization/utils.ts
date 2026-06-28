export interface GroupInfo {
  id: string;
  name: string;
  color?: string;
}

interface GroupsData {
  [targetId: string]: {
    groups: GroupInfo[];
    activeGroupId: string;
  };
}

const STORAGE_KEY = '__EDITOR_OPTIMIZATION_GROUPS__';
const BLOCK_MAP_KEY = '__BLOCK_GROUP_MAP__';

export const ALL_GROUPS_ID = '__ALL__';
export const UNGROUPED_ID = '__UNGROUPED__';

const DEFAULT_GROUPS: GroupInfo[] = [
  { id: UNGROUPED_ID, name: '未分组' },
];

let globalVM: any = null;
export function setGlobalVM(vm: any) { globalVM = vm; }

function getProjectIdentifier(): string {
  if (!globalVM) return 'default_project';
  const runtime = globalVM.runtime;
  if (runtime) {
    if ((runtime as any).projectId) return (runtime as any).projectId;
    if ((runtime as any).projectName) return (runtime as any).projectName;
    const targets = runtime.targets;
    if (targets && targets.length > 0) return `project_${targets[0].id}`;
  }
  return 'default_project';
}
function getProjectLSKey(baseKey: string) { return baseKey + '_' + getProjectIdentifier(); }

function getStorage(): GroupsData {
  if (!(window as any)[STORAGE_KEY]) (window as any)[STORAGE_KEY] = {};
  return (window as any)[STORAGE_KEY];
}
function ensureTargetData(targetId: string) {
  const s = getStorage();
  if (!s[targetId]) s[targetId] = { groups: [...DEFAULT_GROUPS], activeGroupId: ALL_GROUPS_ID };
  return s[targetId];
}

export function getGroups(targetId: string) { return ensureTargetData(targetId).groups; }
export function getActiveGroupId(targetId: string) { return ensureTargetData(targetId).activeGroupId; }
export function setActiveGroupId(targetId: string, groupId: string) {
  const s = getStorage();
  if (s[targetId]) { s[targetId].activeGroupId = groupId; saveToLocalStorage(); }
}
export function addGroup(targetId: string, name: string): GroupInfo {
  const s = getStorage(); ensureTargetData(targetId);
  const ng = { id: `group_${Date.now()}_${Math.random().toString(36).substr(2,6)}`, name };
  s[targetId].groups.push(ng);
  saveToLocalStorage();
  return ng;
}
export function deleteGroup(targetId: string, groupId: string) {
  const s = getStorage(); if (!s[targetId]) return;
  const data = s[targetId];
  if (groupId === UNGROUPED_ID || groupId === ALL_GROUPS_ID) return;
  data.groups = data.groups.filter(g => g.id !== groupId);
  if (data.activeGroupId === groupId) data.activeGroupId = ALL_GROUPS_ID;
  saveToLocalStorage();
}
export function renameGroup(targetId: string, groupId: string, newName: string) {
  const s = getStorage(); if (!s[targetId]) return;
  const g = s[targetId].groups.find(g => g.id === groupId);
  if (g) { g.name = newName; saveToLocalStorage(); }
}

// ---------- 积木分组映射（内存） ----------
function getBlockGroupMap(): Map<string, string> {
  if (!(window as any)[BLOCK_MAP_KEY]) (window as any)[BLOCK_MAP_KEY] = new Map();
  return (window as any)[BLOCK_MAP_KEY];
}
export function getBlockGroup(block: any): string {
  const map = getBlockGroupMap();
  return map.get(block?.id) || UNGROUPED_ID;
}

// 设置分组：写入内存 Map 和积木 comment，并隐藏分组注释
export function setBlockGroup(block: any, groupId: string, targetId?: string) {
  if (!block?.id) return;
  let groupName = '未分组';
  if (targetId) {
    const g = getGroups(targetId).find(g => g.id === groupId);
    groupName = g ? g.name : '未分组';
  }
  const commentText = `${groupId}|EdiOpt|${groupName}`;

  // 延迟写入注释（拖拽期间暂停，拖拽结束后批量写入）
  scheduleCommentWrite(block.id, commentText, block.workspace);

  const map = getBlockGroupMap();
  map.set(block.id, groupId);
  saveBlockMapToLocalStorage();
  return commentText;
}
// 从 XML 注释恢复分组信息

export function restoreBlockGroupFromXml(blockNode: Element, targetId: string) {
  const blockId = blockNode.getAttribute('id');
  if (!blockId) return;
  
  const commentNode = blockNode.querySelector('comment');
  const commentText = commentNode?.textContent || '';
  if (!commentText) return;
  
  const separator = '|EdiOpt|';
  const sepIdx = commentText.indexOf(separator);
  if (sepIdx <= 0) return; // 分隔符必须在第一个字符之后
  const groupId = commentText.substring(0, sepIdx);
  const groupName = commentText.substring(sepIdx + separator.length);
  
  const map = getBlockGroupMap();
  map.set(blockId, groupId);
  
  ensureGroupWithName(targetId, groupId, groupName);
}

function ensureGroupWithName(targetId: string, groupId: string, groupName: string) {
  if (groupId === UNGROUPED_ID || groupId === ALL_GROUPS_ID) return;
  const s = getStorage();
  if (!s[targetId]) ensureTargetData(targetId);
  const groups = s[targetId].groups;
  const existing = groups.find(g => g.id === groupId);
  if (!existing) {
    groups.push({ id: groupId, name: groupName });
    saveToLocalStorage();
  } else {
    if (existing.name.startsWith('分组_') && groupName !== existing.name) {
      existing.name = groupName;
      saveToLocalStorage();
    }
  }
}

// ---------- LocalStorage 持久化 ----------
const LS_GROUPS_KEY_BASE = 'gandi_plugin_groups';
const LS_BLOCK_MAP_KEY_BASE = 'gandi_plugin_blockmap';

function saveToLocalStorage() {
  try {
    const data = (window as any)[STORAGE_KEY];
    if (data) localStorage.setItem(getProjectLSKey(LS_GROUPS_KEY_BASE), JSON.stringify(data));
  } catch(e){}
}
function saveBlockMapToLocalStorage() {
  try {
    const map = getBlockGroupMap();
    const obj: Record<string,string> = {};
    map.forEach((v,k) => obj[k]=v);
    localStorage.setItem(getProjectLSKey(LS_BLOCK_MAP_KEY_BASE), JSON.stringify(obj));
  } catch(e){}
}
export function loadFromLocalStorage() {
  try {
    const g = localStorage.getItem(getProjectLSKey(LS_GROUPS_KEY_BASE));
    if (g) (window as any)[STORAGE_KEY] = JSON.parse(g);
    const b = localStorage.getItem(getProjectLSKey(LS_BLOCK_MAP_KEY_BASE));
    if (b) {
      const obj = JSON.parse(b);
      const map = new Map<string,string>();
      for (const k in obj) map.set(k, obj[k]);
      (window as any)[BLOCK_MAP_KEY] = map;
    }
  } catch(e){}
}
// 延迟注释写入队列(如果立即添加会导致积木的子结构布局错误，并且我一直修不好)
type PendingComment = { blockId: string; commentText: string; workspace: any };
const pendingCommentWrites: PendingComment[] = [];
let isCommentWriteLocked = false;

export function lockCommentWrite(locked: boolean) {
  isCommentWriteLocked = locked;
  if (!locked && pendingCommentWrites.length > 0) {
    flushPendingCommentWrites();
  }
}

export function scheduleCommentWrite(blockId: string, commentText: string, workspace: any) {
  if (!blockId || !workspace) return;
  if (isCommentWriteLocked) {
    pendingCommentWrites.push({ blockId, commentText, workspace });
  } else {
    // 未锁定，直接写入
    const block = workspace.getBlockById(blockId);
    if (block?.setCommentText) {
      block.setCommentText(commentText);
    }
  }
}

function flushPendingCommentWrites() {
  // 拖拽刚结束，同步写入最安全，不会影响布局
  for (let i = 0; i < pendingCommentWrites.length; i++) {
    const { blockId, commentText, workspace } = pendingCommentWrites[i];
    const block = workspace.getBlockById(blockId);
    if (block?.setCommentText) {
      block.setCommentText(commentText); // 此时会触发我们的劫持，图标自动隐藏
    }
  }
  pendingCommentWrites.length = 0;
}