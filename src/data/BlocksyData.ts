export type Vector3Data = [number, number, number];
export type Vector2Data = [number, number];

export interface BlockShapeFaceData
{
    name: string;

    positions: Vector3Data[];
    texturing: Vector2Data[];
    indexes: number[];
}

export interface BlockShapeData
{
    name: string;
    uuid: string;

    faces: BlockShapeFaceData[];
}

export interface BlockDesignData
{
    name: string;

    shape: BlockShapeData;
    faces: number[];
}

export interface TextureData
{
    uuid: string;
    name: string;

    size: [number, number];
    data: Uint8ClampedArray;
}

export interface BlocksetData
{
    name: string;
    uuid: string;

    designs: BlockDesignData[];
    texture: string;
}

export interface BlockData
{
    design: number;
    position: Vector3Data;
    rotation: number;
};

export interface StageData
{
    name: string;
    uuid: string;

    blockset: string;
    blocks: BlockData[];
}

export interface BlocksyProjectData
{
    name: string;
    uuid: string;

    shapes: BlockShapeData[];
    blocksets: BlocksetData[];
    stages: StageData[];
}
