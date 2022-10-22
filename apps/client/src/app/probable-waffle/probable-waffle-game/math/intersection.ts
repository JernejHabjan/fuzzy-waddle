export interface Vector2Simple {
  x: number;
  y: number;
}

export class Intersection {
  static intersectsWithRectangle = (M: Vector2Simple, rectangleForIntersection: Phaser.Geom.Polygon) => {
    const A = rectangleForIntersection.points[0];
    const B = rectangleForIntersection.points[1];
    // const C = rectangleForIntersection.points[2];
    const D = rectangleForIntersection.points[3];
    const AM = { x: M.x - A.x, y: M.y - A.y };
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const AD = { x: D.x - A.x, y: D.y - A.y };

    const AM_scalar_AB = AM.x * AB.x + AM.y * AB.y;
    const AM_scalar_AD = AM.x * AD.x + AM.y * AD.y;
    const AB_scalar_AB = AB.x * AB.x + AB.y * AB.y;
    const AD_scalar_AD = AD.x * AD.x + AD.y * AD.y;

    // noinspection UnnecessaryLocalVariableJS
    const inRectangle =
      0 <= AM_scalar_AB && AM_scalar_AB <= AB_scalar_AB && 0 <= AM_scalar_AD && AM_scalar_AD <= AD_scalar_AD;

    return inRectangle;
  };
}
