import { BufferGeometry, Float32BufferAttribute, BufferAttribute, Vector2 } from 'three';
import { lerp, randomInt } from '../tools/utility';
import BlockShape from './BlockShape';
import { BlockDesignData, BlockDesignFaceData } from './BlocksyData';
import Blockset from './Blockset';
import { SquareOrientation, transformer } from '../tools/SquareOrientation';

// TODO: buffer attribute is view not model data...
export default class BlockDesign 
{
    public name = "invalid design";

    public shape: BlockShape;
    public readonly faces = new Map<string, [number, SquareOrientation]>();

    public texcoordBuffer: BufferAttribute;
    public geometry = new BufferGeometry();

    public setShape(shape: BlockShape): void
    {
        this.shape = shape;

        // TODO: dispose old texcoordBuffer when threejs adds support

        this.texcoordBuffer = new Float32BufferAttribute(this.shape.texcoords, 2);

        this.geometry.addAttribute("position", this.shape.positionBuffer);
        this.geometry.addAttribute("normal",   this.shape.normalBuffer);
        this.geometry.addAttribute("uv",       this.texcoordBuffer);
        this.geometry.setIndex(this.shape.indices);
    }

    public fromData(data: BlockDesignData, shapes: BlockShape[], blockset: Blockset): this
    {
        this.name = data.name;

        const shape = shapes.find(shape => shape.uuid === data.shape)!;

        this.setShape(shape);

        data.faces.forEach(([faceID, tileID, orientation]) =>
        {
            this.setFaceTile(faceID, blockset, tileID, orientation || randomInt(0, 7));
        });

        return this;
    }

    public toData(): BlockDesignData
    {
        return {
            name: this.name,
            shape: this.shape.uuid,
            faces: Array.from(this.faces).map(([face, [tileID, orientation]]) => [face, tileID, orientation] as BlockDesignFaceData),
        };
    }

    public setFaceTile(faceID: string, 
                       blockset: Blockset, 
                       tileID: number,
                       orientation: SquareOrientation): void
    {
        this.faces.set(faceID, [tileID, orientation]);
        this.setFaceTile_(faceID, blockset.getTileTexccords(tileID), orientation);
    } 

    public setFaceTile_(faceID: string, 
                        [xmin, ymin, xmax, ymax]: number[],
                        orientation: SquareOrientation): void 
    {
        const face = this.shape.faces.get(faceID)!;
        const base = this.shape.texcoords;
        const dest = this.texcoordBuffer;

        const transform = transformer[orientation];

        for (let i = 0; i < face.length; ++i) 
        {
            const index = face[i];

            const x = base[index * 2 + 0];
            const y = base[index * 2 + 1];
            
            const coord = transform(new Vector2(x, y));

            dest.setX(index, lerp(xmin, xmax, coord.x));
            dest.setY(index, lerp(ymin, ymax, coord.y));
        }

        dest.needsUpdate = true;
    }
}
