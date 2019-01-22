import { BlocksetData } from "./BlocksyData";
import BlockDesign from "./BlockDesign";
import BlockShape from "./BlockShape";
import { MTexture } from "../tools/MTexture";
import { MeshBasicMaterial, CanvasTexture, ClampToEdgeWrapping, NearestFilter } from "three";

export default class Blockset
{
    public name = "invalid blockset";
    public uuid = "invalid uuid";

    public designs: BlockDesign[] = [];
    public texture: MTexture;

    public texture3: CanvasTexture;
    public material = new MeshBasicMaterial({ color: 0xffffff });

    // TODO: should all this be here...
    public setTexture(texture: MTexture): void
    {
        this.texture = texture;
        this.texture3 = new CanvasTexture(this.texture.canvas,
                                          undefined, 
                                          ClampToEdgeWrapping,
                                          ClampToEdgeWrapping, 
                                          NearestFilter, 
                                          NearestFilter);
        this.material.setValues({map: this.texture3});

        this.texture.canvas.addEventListener("flush", () => this.texture3.needsUpdate = true);
    }

    public fromData(data: BlocksetData, shapes: BlockShape[]): this
    {
        this.name = data.name;
        this.uuid = data.uuid;

        this.designs = data.designs.map(d => new BlockDesign().fromData(d, shapes, this));
        
        const texture = new MTexture(...data.texture.size);
        texture.data.data.set(data.texture.data);
        texture.context.putImageData(texture.data, 0, 0);
        texture.update();

        this.setTexture(texture);

        return this;
    }

    public toData(): BlocksetData
    {
        this.texture.fetch();

        return {
            name: this.name,
            uuid: this.uuid,

            designs: this.designs.map(design => design.toData()),
            texture: {
                name: "eh",
                uuid: "invalid",
                size: [this.texture.data.width, this.texture.data.height],
                data: this.texture.data.data,
            },
        };
    }

    public getTileTexccords(tileID: number): [number, number, number, number]
    {
        const x = (tileID % 8);
        const y = Math.floor(tileID / 8);
        const factor = 1 / 8;

        return [(x + 0) * factor, (y + 0) * factor,
                (x + 1) * factor, (y + 1) * factor];
    }
}
