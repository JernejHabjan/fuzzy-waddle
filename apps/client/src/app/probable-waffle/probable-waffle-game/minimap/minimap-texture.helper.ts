export class MinimapTextureHelper{
  private scene: Phaser.Scene;
  constructor(scene:Phaser.Scene) {
    this.scene=scene;
  }

  update(objects: Phaser.GameObjects.Sprite[]){
    const renderTexture=this.scene.add.renderTexture(0,0,200, 200)
    // set render texture background
    renderTexture.fill(0x000000, 0.5);
    renderTexture.setScale(0.1,0.1)
    objects.forEach((object) => {
      renderTexture.draw(object, object.x, object.y);
    });
  }
}
