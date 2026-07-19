class PhaserRexPluginMock {
  constructor() {
    this.isSwiped = false;
    this.left = false;
    this.right = false;
  }

  on() {
    return this;
  }

  destroy() {}
}

module.exports = PhaserRexPluginMock;
module.exports.default = PhaserRexPluginMock;
