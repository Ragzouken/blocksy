import { BufferGeometry, Float32BufferAttribute, BufferAttribute } from 'three';
import { lerp } from '../tools/utility';
import BlockShape from './BlockShape';
import { BlockDesignData } from './BlocksyData';
import Blockset from './Blockset';

// TODO: buffer attribute is view not model data...
export default class BlockDesign 
{
    public name = "invalid design";

    private shape: BlockShape;
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

        const bla = Array.from(this.shape.faces.keys());

        data.faces.forEach((tileID, index) =>
        {
            this.setFaceTile(bla[index], ...blockset.getTileTexccords(tileID));
        });

        return this;
    }

    public toData(): BlockDesignData
    {
        return {
            name: this.name,
            shape: this.shape.uuid,
            faces: [],
        };
    }

    public setFaceTile(faceID: string, 
                       xmin: number, ymin: number, 
                       xmax: number, ymax: number): void 
    {
        const face = this.shape.faces.get(faceID)!;
        const base = this.shape.texcoords;
        const dest = this.texcoordBuffer;

        for (let i = 0; i < face.length; ++i) 
        {
            const index = face[i];

            dest.setX(index, lerp(xmin, xmax, base[index * 2 + 0]));
            dest.setY(index, lerp(ymin, ymax, base[index * 2 + 1]));
        }
    }
}