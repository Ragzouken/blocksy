import { Vector3 } from "three";
import { randomInt } from "../tools/utility";
import { StageData, Vector3Data } from "./BlocksyData";
import Blockset from "./Blockset";
import BlocksyProject from "./BlocksyProject";

export interface Block
{
    designID: number;
    position: Vector3;
    orientation: number;
};

export default class Stage
{
    public uuid = "invalid";
    public name = "unnamed stage";

    public blockset: Blockset;
    public readonly blocks = new Map<string, Block>();

    public toData(): StageData
    {
        return {
            name: this.name,
            uuid: this.uuid,

            blockset: this.blockset.uuid,
            blocks: Array.from(this.blocks.values()).map(block => ({
                design: block.designID,
                position: block.position.toArray() as Vector3Data,
                rotation: block.orientation,
            })),
        }
    }

    public fromData(data: StageData, project: BlocksyProject): this
    {
        this.name = data.name;
        this.uuid = data.uuid;

        this.blockset = project.blocksets.find(set => set.uuid == data.blockset)!;
        data.blocks.forEach(block =>
        {
            const index = block.position.join(",");
            this.blocks.set(index, {
                designID: block.design,
                position: new Vector3(...block.position),
                orientation: block.rotation,
            });
        });

        return this;
    }
}

export function makeRandomStage(blockset: Blockset): Stage
{
    const stage = new Stage();
    stage.blockset = blockset;

    for (let z = -4; z < 4; ++z)
    {
        for (let x = -4; x < 4; ++x)
        {
            const block = {
                designID: randomInt(0, blockset.designs.length - 1),
                position: new Vector3(x, randomInt(0, 1), z),
                orientation: randomInt(0, 3),
            }

            stage.blocks.set(block.position.x+","+block.position.y+","+block.position.z, block);
        }
    }

    return stage;
}
