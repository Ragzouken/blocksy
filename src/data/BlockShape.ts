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

    public AddTriangleFace(id: string,
                           v0: Vector3, t0: Vector2,
                           v1: Vector3, t1: Vector2,
                           v2: Vector3, t2: Vector2): void
    {
        const count = this.vertexCount;

        // one triangle
        const face = [count + 0, count + 1, count + 2];

        this.faces.set(id, face);
        this.indices.push(...face);
        this.tri2face.push(id);

        // three given positions
        this.positions.push(v0.x, v0.y, v0.z,
                            v1.x, v1.y, v1.z,
                            v2.x, v2.y, v2.z);

        // three given texcoords
        this.texcoords.push(t0.x, t0.y,
                            t1.x, t1.y,
                            t2.x, t2.y);

        // three identical normals
        const normal = faceNormal(v0, v1, v2);

        this.normals.push(normal.x, normal.y, normal.z);
        this.normals.push(normal.x, normal.y, normal.z);
        this.normals.push(normal.x, normal.y, normal.z);
    }

    public AddQuadFace(id: string,
                       v0: Vector3, t0: Vector2,
                       v1: Vector3, t1: Vector2,
                       v2: Vector3, t2: Vector2,
                       v3: Vector3, t3: Vector2): void
    {
        const count = this.vertexCount;
        
        // two triangles for the quad face
        this.faces.set(id, [count + 0, count + 1, count + 2, count + 3]);
        this.indices.push(count + 0, count + 1, count + 2,
                          count + 0, count + 2, count + 3);
        this.tri2face.push(id, id);

        // four given positions
        this.positions.push(v0.x, v0.y, v0.z,
                            v1.x, v1.y, v1.z,
                            v2.x, v2.y, v2.z,
                            v3.x, v3.y, v3.z);

        // four given texcoords
        this.texcoords.push(t0.x, t0.y,
                            t1.x, t1.y,
                            t2.x, t2.y,
                            t3.x, t3.y);

        // four identical normals
        const normal = faceNormal(v0, v1, v2);

        this.normals.push(normal.x, normal.y, normal.z,
                          normal.x, normal.y, normal.z,
                          normal.x, normal.y, normal.z,
                          normal.x, normal.y, normal.z);
    }
}
