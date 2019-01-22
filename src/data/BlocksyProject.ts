import { BlocksyProjectData } from "./BlocksyData";
import BlockShape from "./BlockShape";
import Blockset from "./Blockset";
import Stage from "./Stage";

export default class BlocksyProject
{
    public name = "invalid blocksy project"
    public uuid = "invalid uuid";

    public shapes: BlockShape[] = [];
    public blocksets: Blockset[] = [];
    public stages: Stage[] = [];

    public fromData(data: BlocksyProjectData): this
    {
        this.name = data.name;
        this.uuid = data.uuid;

        this.shapes = data.shapes.map(shape => new BlockShape().fromData(shape));
        this.blocksets = data.blocksets.map(d => new Blockset().fromData(d, this.shapes));
        this.stages = data.stages.map(d => new Stage().fromData(d, this));

        return this;
    }

    public toData(): BlocksyProjectData
    {
        return {
            name: this.name,
            uuid: this.uuid,

            shapes: this.shapes.map(shape => shape.toData()),
            blocksets: this.blocksets.map(blockset => blockset.toData()),
            stages: this.stages.map(stage => stage.toData()),
        };
    }
}
