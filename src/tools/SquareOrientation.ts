import { Vector2, Vector } from "three";

export enum SquareOrientation
{
    None0,
    None1,
    None2,
    None3,
    Flip0,
    Flip1,
    Flip2,
    Flip3,
}

type Transformation = {[x in SquareOrientation]: SquareOrientation}

export const flippedH: Transformation = {
    [SquareOrientation.None0]: SquareOrientation.Flip0,
    [SquareOrientation.None1]: SquareOrientation.Flip3,
    [SquareOrientation.None2]: SquareOrientation.Flip2,
    [SquareOrientation.None3]: SquareOrientation.Flip1,
    [SquareOrientation.Flip0]: SquareOrientation.Flip0,
    [SquareOrientation.Flip1]: SquareOrientation.None3,
    [SquareOrientation.Flip2]: SquareOrientation.None2,
    [SquareOrientation.Flip3]: SquareOrientation.None1,
};

export const flippedV: Transformation =
{
    [SquareOrientation.None0]: SquareOrientation.Flip2,
    [SquareOrientation.None1]: SquareOrientation.Flip0,
    [SquareOrientation.None2]: SquareOrientation.Flip3,
    [SquareOrientation.None3]: SquareOrientation.Flip2,
    [SquareOrientation.Flip0]: SquareOrientation.None2,
    [SquareOrientation.Flip1]: SquareOrientation.None1,
    [SquareOrientation.Flip2]: SquareOrientation.None0,
    [SquareOrientation.Flip3]: SquareOrientation.None3,
};

export const rotatedCW: Transformation =
{
    [SquareOrientation.None0]: SquareOrientation.None1,
    [SquareOrientation.None1]: SquareOrientation.None2,
    [SquareOrientation.None2]: SquareOrientation.None3,
    [SquareOrientation.None3]: SquareOrientation.None0,
    [SquareOrientation.Flip0]: SquareOrientation.Flip1,
    [SquareOrientation.Flip1]: SquareOrientation.Flip2,
    [SquareOrientation.Flip2]: SquareOrientation.Flip3,
    [SquareOrientation.Flip3]: SquareOrientation.Flip0,
};

export const rotatedACW: Transformation =
{
    [SquareOrientation.None0]: SquareOrientation.None3,
    [SquareOrientation.None1]: SquareOrientation.None0,
    [SquareOrientation.None2]: SquareOrientation.None1,
    [SquareOrientation.None3]: SquareOrientation.None2,
    [SquareOrientation.Flip0]: SquareOrientation.Flip3,
    [SquareOrientation.Flip1]: SquareOrientation.Flip0,
    [SquareOrientation.Flip2]: SquareOrientation.Flip1,
    [SquareOrientation.Flip3]: SquareOrientation.Flip2,
};

export const transformer: {[x in SquareOrientation]: (coord: Vector2) => Vector2} =
{
    [SquareOrientation.None0]: coord => new Vector2(    coord.x,     coord.y),
    [SquareOrientation.None1]: coord => new Vector2(1 - coord.y,     coord.x),
    [SquareOrientation.None2]: coord => new Vector2(1 - coord.x, 1 - coord.y),
    [SquareOrientation.None3]: coord => new Vector2(    coord.y, 1 - coord.x),
    [SquareOrientation.Flip0]: coord => new Vector2(1 - coord.x,     coord.y),
    [SquareOrientation.Flip1]: coord => new Vector2(    coord.y,     coord.x),
    [SquareOrientation.Flip2]: coord => new Vector2(    coord.x, 1 - coord.y),
    [SquareOrientation.Flip3]: coord => new Vector2(1 - coord.y, 1 - coord.x),
};
