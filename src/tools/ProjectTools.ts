import BlocksyProject from "../data/BlocksyProject";
import { v4 as uuid4 } from 'uuid';
import { Cube, Ramp } from "../data/DefaultShapes";
import BlockShape from "../data/BlockShape";
import Blockset from "../data/Blockset";
import Stage, { makeRandomStage } from "../data/Stage";
import { MTexture } from "./MTexture";
import { randomInt, rgb2hex } from "./utility";
import BlockDesign from "../data/BlockDesign";
import { BlockDesignData } from "../data/BlocksyData";

export function createBlankProject(): BlocksyProject
{
    const project = new BlocksyProject();

    project.name = "Unnamed Blocksy Project";
    project.uuid = uuid4();
    project.shapes.push(new BlockShape().fromData(Cube), 
                        new BlockShape().fromData(Ramp));

    const blockset = new Blockset();
    blockset.name = "Unnamed Blockset";
    blockset.uuid = uuid4();

    blockset.texture = new MTexture(128, 128);
    for (let i = 0; i < 1024; ++i)
    {
        const x = randomInt(0, 127);
        const y = randomInt(0, 127);

        blockset.texture.context.fillStyle = rgb2hex([x, y, 128]);
        blockset.texture.context.fillRect(x, y, 16, 16);
    }
    blockset.texture.fetch();
    
    for (let i = 0; i < 3; ++i)
    {
        const data: BlockDesignData = {
            name: `Cube {i}`,
            shape: project.shapes[0].uuid,
            faces: [randomInt(0, 16), randomInt(0, 16), randomInt(0, 16), 
                    randomInt(0, 16), randomInt(0, 16), randomInt(0, 16)],
        }

        const cube = new BlockDesign().fromData(data, project.shapes, blockset);
        blockset.designs.push(cube);
    }

    for (let i = 0; i < 3; ++i)
    {
        const data: BlockDesignData = {
            name: `Ramp {i}`,
            shape: project.shapes[1].uuid,
            faces: [randomInt(0, 16), randomInt(0, 16), randomInt(0, 16), 
                    randomInt(0, 16), randomInt(0, 16)],
        }

        const ramp = new BlockDesign().fromData(data, project.shapes, blockset);
        blockset.designs.push(ramp);
    }

    const stage = makeRandomStage(blockset);
    stage.name = "Unnamed Stage";
    stage.uuid = uuid4();

    project.blocksets.push(blockset);
    project.stages.push(stage);

    return project;
}
