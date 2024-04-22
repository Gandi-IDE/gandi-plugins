/**
 * Helper class to flash a Blockly scratch block in the users workspace
 */
class BlockFlasher {
  block: Blockly.Block | null;
  count: number;
  flashOn: boolean;
  timerId: NodeJS.Timeout;
  constructor() {
    this.block = null;
    this.timerId = null;
    this.flashOn = false;
    this.count = 0;

    this.start = this.start.bind(this);
    this.privateFlash = this.privateFlash.bind(this);
  }

  /**
   * FLash a block 3 times
   */
  start(block: Blockly.Block) {
    if (this.timerId) {
      clearTimeout(this.timerId);
      if (this.block?.svgPath_) {
        this.block.svgPath_.style.fill = "";
      }
    }

    this.count = 4;
    this.flashOn = true;
    this.block = block;
    this.privateFlash(block);
  }

  /**
   * Internal method to switch the colour of a block between light yellow and it's original colour
   */
  private privateFlash(block: Blockly.Block) {
    if (block.svgPath_) {
      block.svgPath_.style.fill = this.flashOn ? "#ffff80" : "";
    }
    this.flashOn = !this.flashOn;
    this.count--;
    if (this.count > 0) {
      this.timerId = setTimeout(() => this.privateFlash(this.block), 200);
    } else {
      this.timerId = null;
      this.block = null;
    }
  }
}

export default new BlockFlasher();
