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

    project.shapes.forEach(shape =>
    {
        shape.positions.forEach((v, i) =>
        {
            shape.positions[i] = v - .5;
        });

        shape.positionBuffer.set(shape.positions);
        shape.positionBuffer.needsUpdate = true;
    });

    const blockset = new Blockset();
    blockset.name = "Unnamed Blockset";
    blockset.uuid = uuid4();

    blockset.setTexture(new MTexture(128, 128));

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
        const cube = new BlockDesign();
        cube.name = `Cube ${i}`;
        cube.setShape(project.shapes[0]);
        cube.setFaceTile("front",  blockset, randomInt(0, 16));
        cube.setFaceTile("back",   blockset, randomInt(0, 16));
        cube.setFaceTile("left",   blockset, randomInt(0, 16));
        cube.setFaceTile("right",  blockset, randomInt(0, 16));
        cube.setFaceTile("top",    blockset, randomInt(0, 16));
        cube.setFaceTile("bottom", blockset, randomInt(0, 16));
        
        blockset.designs.push(cube);
    }

    for (let i = 0; i < 3; ++i)
    {
        const ramp = new BlockDesign();
        ramp.name = `Ramp ${i}`;
        ramp.setShape(project.shapes[1]);
        ramp.setFaceTile("slope",  blockset, randomInt(0, 16));
        ramp.setFaceTile("back",   blockset, randomInt(0, 16));
        ramp.setFaceTile("left",   blockset, randomInt(0, 16));
        ramp.setFaceTile("right",  blockset, randomInt(0, 16));
        ramp.setFaceTile("bottom", blockset, randomInt(0, 16));
        
        blockset.designs.push(ramp);
    }

    const stage = makeRandomStage(blockset);
    stage.name = "Unnamed Stage";
    stage.uuid = uuid4();

    project.blocksets.push(blockset);
    project.stages.push(stage);

    return project;
}
