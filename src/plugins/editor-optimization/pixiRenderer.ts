// pixiRenderer.ts
import * as PIXI from "pixi.js";
import {
  getActiveGroupId,
  getBlockGroup,
  ALL_GROUPS_ID,
} from "./utils";

// ---------- 积木渲染数据接口 ----------
export interface FieldData {
  text: string;
  x: number;
  y: number;
  fill: string;
  fontFamily?: string;
  fontSize?: number;
  anchorX?: number;
  anchorY?: number;
}

export interface InputData {
  x: number;
  y: number;
  pathD: string;
  fill: string;
}

export interface BlockRenderData {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pathD: string;
  color: string;
  stroke: string;
  opacity: number;
  depth: number;
  fields: FieldData[];
  inputs: InputData[];
}

// ---------- 从 Blockly 积木树提取渲染数据 ----------
function getDepth(block: any): number {
  let depth = 0;
  let b = block;
  while (b.parentBlock_) { depth++; b = b.parentBlock_; }
  return depth;
}

function getFieldFill(field: any, blockly: any): string {
  const root = field.getSvgRoot();
  if (root) {
    const textEl = root.querySelector("text");
    if (textEl) {
      const fill = textEl.getAttribute("fill");
      if (fill) return fill;
    }
  }
  if (field instanceof blockly.FieldTextInput) return "#000000";
  return "#ffffff";
}

export function extractTreeBlocks(rootBlock: any, blockly: any): BlockRenderData[] {
  const list: BlockRenderData[] = [];
  const stack = [rootBlock];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const block = stack.pop();
    if (!block || visited.has(block.id)) continue;
    visited.add(block.id);
    if (!block.svgPath_) continue;

    const pos = block.getRelativeToSurfaceXY();
    const pathD = block.svgPath_.getAttribute("d") || "";
    const color = block.getColour();
    const stroke = block.getColourTertiary();
    const fields: FieldData[] = [];
    const inputs: InputData[] = [];

    for (const input of block.inputList) {
      for (const field of input.fieldRow) {
        const root = field.getSvgRoot();
        if (!root) continue;
        const transform = root.getAttribute("transform");
        let fx = 0, fy = 0;
        if (transform) {
          const m = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
          if (m) { fx = parseFloat(m[1]); fy = parseFloat(m[2]); }
        }
        const textEl = root.querySelector("text") || (root.tagName === "text" ? root : null);
        let textX = 0, textY = 0;
        let anchorX = 0, anchorY = 0;
        if (textEl) {
          textX = parseFloat(textEl.getAttribute("x") || "0");
          textY = parseFloat(textEl.getAttribute("y") || "0");
          const ta = textEl.getAttribute("text-anchor") || "start";
          if (ta === "middle") anchorX = 0.5;
          else if (ta === "end") anchorX = 1;
          const db = textEl.getAttribute("dominant-baseline") || "baseline";
          if (db === "middle") anchorY = 0.5;
          else if (db === "hanging") anchorY = 0;
        }
        const finalX = fx + textX;
        const finalY = fy + textY - 2;
        fields.push({
          text: field.getText(),
          x: finalX,
          y: finalY,
          fill: getFieldFill(field, blockly),
          fontFamily: "sans-serif",
          fontSize: 16,
          anchorX,
          anchorY,
        });
      }
      if (input.outlinePath && !(input.connection && input.connection.targetBlock())) {
        const op = input.outlinePath;
        const opTransform = op.getAttribute("transform") || "";
        let opX = 0, opY = 0;
        const opM = opTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (opM) { opX = parseFloat(opM[1]); opY = parseFloat(opM[2]); }
        inputs.push({
          x: opX,
          y: opY,
          pathD: op.getAttribute("d") || "",
          fill: op.getAttribute("fill") || "#FFFFFF",
        });
      }
    }

    list.push({
      id: block.id,
      type: block.type,
      x: pos.x,
      y: pos.y,
      width: block.width || 0,
      height: block.height || 0,
      pathD,
      color,
      stroke,
      opacity: block.getOpacity(),
      depth: getDepth(block),
      fields,
      inputs,
    });

    if (block.nextConnection) {
      const next = block.nextConnection.targetBlock();
      if (next) stack.push(next);
    }
    for (const input of block.inputList) {
      if (input.connection) {
        const child = input.connection.targetBlock();
        if (child) stack.push(child);
      }
    }
  }
  list.sort((a, b) => a.depth - b.depth);
  return list;
}

// ---------- PixiBlockRenderer 类 ----------
export class PixiBlockRenderer {
  private app!: PIXI.Application;
  private world: PIXI.Container;
  private wrapper: HTMLElement;
  private workspace: any;
  private blockly: any;
  private vm: any;
  private textTextureCache: Map<string, PIXI.Texture> = new Map();
  private rootContainers: Map<string, PIXI.Container> = new Map();
  private rootBoundsCache = new Map<string, { minX: number; minY: number; maxX: number; maxY: number }>();
  private pendingFullRefresh = false;
  private pendingTargetId?: string;
  // 用户主动恢复为 DOM 的根积木 ID 集合，之后不再自动 Pixi 化
  private domOnlyRoots: Set<string> = new Set();

  public refreshOverlay: () => Promise<void>;
  public onRestoreDOM?: (rootBlockId: string) => void;
  private interactionsPaused = false;

    public pauseInteractions() {
    if (this.interactionsPaused) return;
    this.interactionsPaused = true;
    for (const container of this.rootContainers.values()) {
      container.eventMode = 'none';
    }
  }

    public resumeInteractions() {
      if (!this.interactionsPaused) return;
      this.interactionsPaused = false;
      for (const container of this.rootContainers.values()) {
        container.eventMode = 'static';
      }
    }
  constructor(wrapper: HTMLElement, workspace: any, blockly: any, vm: any) {
    this.wrapper = wrapper;
    this.workspace = workspace;
    this.blockly = blockly;
    this.vm = vm;
    this.world = new PIXI.Container();
    this.refreshOverlay = this._refreshOverlay.bind(this);
  }

  async init() {
    if (this.app) return;
    this.app = new PIXI.Application();
    await this.app.init({
      width: this.wrapper.clientWidth,
      height: this.wrapper.clientHeight,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: "webgpu",
    });
    this.wrapper.appendChild(this.app.canvas);

    const resizeHandler = () => {
      if (!this.app) return;
      const w = this.wrapper.clientWidth;
      const h = this.wrapper.clientHeight;
      if (w > 0 && h > 0) this.app.renderer.resize(w, h);
    };
    window.addEventListener("resize", resizeHandler);
    (this as any).__resizeHandler = resizeHandler;

    this.app.stage.addChild(this.world);
    this.syncView();
      // 处理初始化完成前积压的刷新请求
      if (this.pendingFullRefresh) {
        this.pendingFullRefresh = false;
        await this.fullRefresh(this.pendingTargetId);
        this.pendingTargetId = undefined;
      }
    this.app.ticker.add(() => {
      this.cullContainers();
    });
  }

  syncView() {
    if (!this.app || !this.app.renderer) return;
    const svgCanvas = (this.workspace as any).svgBlockCanvas_ || this.workspace.getCanvas();
    if (!svgCanvas) return;
    const t = svgCanvas.getAttribute("transform");
    if (!t) return;
    const m = t.match(/translate\(([^)]+)\)\s*scale\(([^)]+)\)/);
    if (!m) return;
    const [tx, ty] = m[1].split(",").map(Number);
    const s = Number(m[2]);
    if (!isFinite(tx) || !isFinite(ty) || !isFinite(s) || s <= 0) return;
    this.world.position.set(tx, ty);
    this.world.scale.set(s);
    this.loadVisibleRoots(false); // 非强制：尊重用户意图
  }

  async fullRefresh(targetId?: string) {
      // 如果渲染器尚未就绪，先挂起请求
      if (!this.app || !this.app.renderer) {
        this.pendingFullRefresh = true;
        if (targetId) this.pendingTargetId = targetId;
        return;
      }
    if (targetId) (this as any).currentTargetId = targetId;
    const ct = this.vm.editingTarget;
    if (!ct) return;
    this.destroyAllContainers();
    this.domOnlyRoots.clear(); // 切换角色时重置
    this.loadVisibleRoots(true); // 强制全部 Pixi 覆盖
  }

  private loadVisibleRoots(force: boolean) {
    const ct = this.vm.editingTarget;
    if (!ct) return;
    const activeId = getActiveGroupId(ct.id);
    const topBlocks = this.workspace.getTopBlocks(false);
    const scale = this.world.scale.x;
    const viewX = -this.world.position.x / scale;
    const viewY = -this.world.position.y / scale;
    const viewW = this.app.renderer ? this.app.screen.width / scale : 0;
    const viewH = this.app.renderer ? this.app.screen.height / scale : 0;
    const margin = 500;

    for (const block of topBlocks) {
      if (block.workspace !== this.workspace || block.workspace.isFlyout) continue;
      if (activeId !== ALL_GROUPS_ID && getBlockGroup(block) !== activeId) continue;

      const rootId = block.id;
      if (this.rootContainers.has(rootId)) continue;

      // 非强制模式下，跳过用户手动保留 DOM 的积木
      if (!force && this.domOnlyRoots.has(rootId)) continue;
      // 非强制模式下，如果 DOM 当前可见，则标记为 domOnly 并跳过
      if (!force && this.isRootDOMVisible(rootId)) {
        this.domOnlyRoots.add(rootId);
        continue;
      }

      let bounds = this.rootBoundsCache.get(rootId);
      if (!bounds) {
        const data = extractTreeBlocks(block, this.blockly);
        if (data.length === 0) continue;
        const minX = Math.min(...data.map(d => d.x));
        const minY = Math.min(...data.map(d => d.y));
        const maxX = Math.max(...data.map(d => d.x + (d.width || 0)));
        const maxY = Math.max(...data.map(d => d.y + (d.height || 0)));
        bounds = { minX, minY, maxX, maxY };
        this.rootBoundsCache.set(rootId, bounds);
      }

      if (
        bounds.maxX > viewX - margin &&
        bounds.minX < viewX + viewW + margin &&
        bounds.maxY > viewY - margin &&
        bounds.minY < viewY + viewH + margin
      ) {
        this.createRootContainer(block);
      }
    }
  }

  private createRootContainer(rootBlock: any) {
  const rootId = rootBlock.id;
  const data = extractTreeBlocks(rootBlock, this.blockly);
  if (data.length === 0) return;

  const container = new PIXI.Container();
  container.visible = true;
  container.alpha = 0.6; // 默认稍暗，hover 时变亮

  const sorted = [...data].sort((a, b) => a.depth - b.depth);

  // 绘制合并的形状（所有积木形状和输入）
  const shapeGraphics = new PIXI.Graphics();
  container.addChild(shapeGraphics);
  const ctx = shapeGraphics.context;

  for (const item of sorted) {
    if (item.pathD) {
      const path = new PIXI.GraphicsPath(item.pathD);
      ctx.translate(item.x, item.y);
      ctx.setFillStyle({ color: item.color });
      ctx.path(path);
      ctx.fill();
      if (item.stroke) {
        ctx.setStrokeStyle({ color: item.stroke, width: 1 });
        ctx.stroke();
      }
      ctx.resetTransform();
    }
    for (const inp of item.inputs) {
      if (inp.pathD) {
        const path = new PIXI.GraphicsPath(inp.pathD);
        ctx.translate(item.x + inp.x, item.y + inp.y);
        ctx.setFillStyle({ color: inp.fill });
        ctx.path(path);
        ctx.fill();
        ctx.resetTransform();
      }
    }
  }

  // 处理文字字段：使用纹理缓存
  for (const item of sorted) {
    for (const f of item.fields) {
      const cacheKey = `${f.fontSize || 16}_${f.fontFamily || 'sans-serif'}_${f.fill}_${f.text}`;

      let texture = this.textTextureCache.get(cacheKey);
      if (!texture) {
        // 创建临时 Text 对象
        const tempText = new PIXI.Text({
          text: f.text,
          style: {
            fontFamily: f.fontFamily || 'sans-serif',
            fontSize: f.fontSize || 16,
            fill: f.fill,
          },
        });
        // 获取文本边界
        const bounds = tempText.getLocalBounds();
        const texW = Math.ceil(bounds.width);
        const texH = Math.ceil(bounds.height);
        if (texW > 0 && texH > 0) {
          const rt = PIXI.RenderTexture.create({
            width: texW,
            height: texH,
            resolution: this.app.renderer.resolution,
          });
          // 将 tempText 放入临时容器，以便渲染
          const tempContainer = new PIXI.Container();
          tempContainer.addChild(tempText);
          tempText.x = -bounds.x;
          tempText.y = -bounds.y;
          this.app.renderer.render({ container: tempContainer, target: rt, clear: true });
          tempContainer.destroy({ children: true });
          texture = rt;
          this.textTextureCache.set(cacheKey, texture);
        } else {
          // 空文本，创建一个空纹理或跳过
          tempText.destroy();
          continue;
        }
      }

      // 使用缓存的纹理创建 Sprite
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(f.anchorX || 0, f.anchorY || 0);
      sprite.x = item.x + f.x;
      sprite.y = item.y + f.y;
      container.addChild(sprite);
    }
  }

  // 交互：hover 时改变透明度
  container.eventMode = this.interactionsPaused ? 'none' : 'static';
  container.cursor = 'pointer';
  (container as any)._rootId = rootId;
  container.on('pointerover', () => { container.alpha = 0.9; });
  container.on('pointerout', () => { container.alpha = 0.6; });

  this.world.addChild(container);
  this.rootContainers.set(rootId, container);
  this.hideRootDOM(rootId);
}

  private setRootHover(rootId: string, hover: boolean) {
    /*
    const container = this.rootContainers.get(rootId);
    if (!container) return;
    const data = this.brightnessData.get(container);
    if (data) {
      data.target = hover ? 1.0 : 0.7;
      const filter = this.brightnessFilters.get(container);
      if (filter) filter.brightness(data.target, false);
      data.current = data.target;
    }*/
  }

  private updateBrightnessIfNeeded() {
    // 亮度已立即应用，无需逐帧更新
  }

  private cullContainers() {
    if (!this.app || !this.app.renderer) return;
    const scale = this.world.scale.x;
    const vx = -this.world.position.x / scale;
    const vy = -this.world.position.y / scale;
    const vw = this.app.screen.width / scale;
    const vh = this.app.screen.height / scale;
    const margin = 200;

    for (const [rootId, container] of this.rootContainers) {
      const bounds = this.rootBoundsCache.get(rootId);
      if (!bounds) continue;
      const visible =
        bounds.maxX > vx - margin &&
        bounds.minX < vx + vw + margin &&
        bounds.maxY > vy - margin &&
        bounds.minY < vy + vh + margin;
      container.visible = visible;
    }
  }

  // ---------- 公开接口 ----------
  clearPixiForRoot(rootBlock: any) {
    if (!rootBlock) return;
    const rootId = rootBlock.id;
    const container = this.rootContainers.get(rootId);
    if (container) {
      container.destroy({ children: true });
      this.rootContainers.delete(rootId);
    }
    this.showRootDOM(rootId);
  }

  /** 标记某个积木树保持 DOM 显示，以后不再自动 Pixi 化 */
  markDOMOnly(rootId: string) {
    this.domOnlyRoots.add(rootId);
  }

  /** 将某积木树从 DOM 模式强制切换回 Pixi（右键菜单等） */
  switchToPixi(rootBlock: any) {
    if (!rootBlock) return;
    const rootId = rootBlock.id;
    this.domOnlyRoots.delete(rootId);
    if (!this.rootContainers.has(rootId)) {
      this.createRootContainer(rootBlock);
    }
  }

  hasPixiForRoot(rootId: string): boolean {
    return this.rootContainers.has(rootId);
  }

  /** 返回被击中的根积木 ID（用于外部双击检测） */
  getChunkAt(screenX: number, screenY: number): string | null {
    if (!this.app || !this.app.renderer) return null;
    const canvasBounds = this.app.canvas.getBoundingClientRect();
    const scale = this.world.scale.x;
    const worldX = (screenX - canvasBounds.left - this.world.position.x) / scale;
    const worldY = (screenY - canvasBounds.top - this.world.position.y) / scale;

    for (const [rootId, container] of this.rootContainers) {
      if (!container.visible) continue;
      const bounds = this.rootBoundsCache.get(rootId);
      if (
        bounds &&
        worldX >= bounds.minX &&
        worldX <= bounds.maxX &&
        worldY >= bounds.minY &&
        worldY <= bounds.maxY
      ) {
        return rootId;
      }
    }
    return null;
  }

  markDirty(rootBlock: any) {
    if (!rootBlock) return;
    const rootId = rootBlock.id;

    // 用户手动保留 DOM 的，不做任何事
    if (this.domOnlyRoots.has(rootId)) return;

    // 如果 DOM 当前可见（如拖拽后），标记为 domOnly 并清除 Pixi（如果存在）
    if (this.isRootDOMVisible(rootId)) {
      this.domOnlyRoots.add(rootId);
      if (this.rootContainers.has(rootId)) {
        this.clearPixiForRoot(rootBlock);
      }
      return;
    }

    // DOM 不可见，重建 Pixi
    if (this.rootContainers.has(rootId)) {
      this.clearPixiForRoot(rootBlock);
    }
    this.createRootContainer(rootBlock);
  }

  cancelBake() {}

  destroy() {
    this.destroyAllContainers();
    if ((this as any).__resizeHandler) {
      window.removeEventListener("resize", (this as any).__resizeHandler);
    }
    try {
      this.app.destroy(true, { children: true, texture: true });
    } catch (e) {}
    this.wrapper.remove();
  }

  private destroyAllContainers() {
    this.textTextureCache.forEach(tex => tex.destroy(true));
    this.textTextureCache.clear();
    for (const container of this.rootContainers.values()) {
      container.destroy({ children: true });
    }
    this.rootContainers.clear();
  }

  private hideRootDOM(rootId: string) {
    const rootBlock = this.workspace.getBlockById(rootId);
    if (!rootBlock) return;
    const blocks = this.getBlockTree(rootBlock);
    for (const b of blocks) {
      if (b.svgGroup_) b.svgGroup_.style.visibility = 'hidden'; // 改用 visibility，避免重排
    }
  }

  private showRootDOM(rootId: string) {
    const rootBlock = this.workspace.getBlockById(rootId);
    if (!rootBlock) return;
    const blocks = this.getBlockTree(rootBlock);
    for (const b of blocks) {
      if (b.svgGroup_) {
        (b.svgGroup_.style as any).contentVisibility = '';
        b.svgGroup_.style.visibility = ''; // 恢复默认可见
        b.svgGroup_.style.position = 'relative';
        b.svgGroup_.style.zIndex = '2';
      }
    }
  }

  private isRootDOMVisible(rootId: string): boolean {
    const block = this.workspace.getBlockById(rootId);
    if (!block || !block.svgGroup_) return false;
    return block.svgGroup_.style.display !== "none";
  }

  private getBlockTree(rootBlock: any): any[] {
    const blocks: any[] = [];
    const stack = [rootBlock];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const b = stack.pop();
      if (!b || visited.has(b.id)) continue;
      visited.add(b.id);
      blocks.push(b);
      if (b.nextConnection) {
        const next = b.nextConnection.targetBlock();
        if (next) stack.push(next);
      }
      for (const input of b.inputList) {
        if (input.connection) {
          const child = input.connection.targetBlock();
          if (child) stack.push(child);
        }
      }
    }
    return blocks;
  }

  private _refreshOverlay(): Promise<void> {
    return this.fullRefresh();
  }
}