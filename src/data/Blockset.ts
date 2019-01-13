import { BlocksetData } from "./BlocksyData";
import BlockDesign from "./BlockDesign";
import BlockShape from "./BlockShape";
import { MTexture } from "../tools/MTexture";

export default class Blockset
{
    public name = "invalid blockset";
    public uuid = "invalid uuid";

    public designs: BlockDesign[] = [];
    public texture: MTexture;

    public fromData(data: BlocksetData, shapes: BlockShape[]): this
    {
        this.name = data.name;
        this.uuid = data.uuid;

        this.designs = data.designs.map(d => new BlockDesign().fromData(d, shapes));
        this.texture = new MTexture(...data.texture.size);
        
        this.texture.data.data.set(data.texture.data);
        this.texture.context.putImageData(this.texture.data, 0, 0);
        this.texture.update();

        return this;
    }

    public toData(): BlocksetData
    {
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
}
