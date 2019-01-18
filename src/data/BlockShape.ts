import { BlockShapeData, Vector2Data, Vector3Data, BlockShapeFaceData } from "./BlocksyData";
import { Vector3, Vector2, Float32BufferAttribute } from "three";

function faceNormal(v0: Vector3, v1: Vector3, v2: Vector3): Vector3
{
    return v1.sub(v0).cross(v2.sub(v1));
}

export default class BlockShape
{
    public name = "invalid shape";
    public uuid = "invalid";

    public indices: number[] = [];
    public positions: number[] = [];
    public texcoords: number[] = [];
    public normals: number[] = [];

    // mapping of face id to list of distinct indices used
    public faces = new Map<string, number[]>();

    // mapping of triangle number to face id
    public tri2face: string[] = [];

    // shareable position attributes
    public positionBuffer: Float32BufferAttribute;
    public normalBuffer:Float32BufferAttribute; 

    public get vertexCount(): number
    {
        return this.positions.length / 3;
    } 

    public fromData(data: BlockShapeData): this
    {
        this.name = data.name;
        this.uuid = data.uuid;

        data.faces.forEach((face, faceIndex) =>
        {
            // offset indices relative to existing vertices
            const indexOffset = this.vertexCount;
            const faceIndexes = face.triangles.reduce<number[]>((a, b) => [...a, ...b], [])
                                              .map(index => index + indexOffset);

            this.indices.push(...faceIndexes);
            this.faces.set(face.name, faceIndexes);

            // compute shared normal and add all positions/texcoords/normals
            const positions = face.positions.slice(0, 3).map(position => new Vector3(...position));
            
            const normal = new Vector3();
            normal.crossVectors(positions[1].clone().sub(positions[0]),
                                positions[2].clone().sub(positions[0])); 

            for (let i in face.positions)
            {
                this.positions.push(...face.positions[i]);
                this.texcoords.push(...face.texturing[i]);
                this.normals.push(normal.x, normal.y, normal.z);
            }

            face.triangles.forEach(_ => this.tri2face.push(face.name));
        });

        this.positions.forEach((v, i) => this.positions[i] = v - .5);

        // threejs stuff
        this.positionBuffer = new Float32BufferAttribute(this.positions, 3);
        this.normalBuffer   = new Float32BufferAttribute(this.normals,   3);

        return this;
    }

    public toData(): BlockShapeData
    {
        const faces: BlockShapeFaceData[] = [];

        this.faces.forEach((indexes, name) =>
        {
            const min = Math.min(...indexes);
            indexes = indexes.map(index => index - min);

            const face: BlockShapeFaceData =
            {
                name: name,
                positions: [],
                texturing: [],
                triangles: [],
            }

            for (let i = 0; i < this.vertexCount; ++i)
            {
                face.positions.push(this.positions.slice(i * 3, i * 3 + 3) as Vector3Data);
                face.texturing.push(this.texcoords.slice(i * 2, i * 2 + 2) as Vector2Data);
            }

            for (let i = 0; i < this.indices.length; i += 1)
            {
                face.triangles.push(indexes.slice(i, i + 3) as Vector3Data);
            }

            faces.push(face);
        });

        const data = {
            name: this.name,
            uuid: this.uuid,
            faces: faces,
        }

        return data;
    }
}
