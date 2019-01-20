import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as utility from '../tools/utility';
import FlicksyEditor from "./FlicksyEditor";
import Panel from "./Panel";
import { Group, Mesh, Vector3, WebGLRenderer, Scene, Raycaster, Vector2 } from 'three';
import BlockDesign from '../data/BlockDesign';
import ThreeLayer from './ThreeLayer';

export default class BlockDesignsPanel implements Panel, ThreeLayer
{
    private readonly sidebar: HTMLElement;
    private readonly group = new Group();

    private readonly meshes: Mesh[] = [];

    private onDesignPicked: (design: number) => void | undefined;

    private scene = new Scene();

    public constructor(private readonly editor: FlicksyEditor)
    {
        const sidebar = <>
            <div className="section">
                <h1>blocks designs</h1>
                <p>manage blocks available for building stages</p>
            </div>
        </>;

        const root = utility.getElement("sidebar");
        this.sidebar = document.createElement("div");
        root.appendChild(this.sidebar);

        ReactDOM.render(sidebar, this.sidebar);

        this.scene.add(this.group);
    }

    public startPickingBlock(callback: (block: number) => void): void
    {
        this.onDesignPicked = callback;
    }

    public get priority(): number
    {
        return 1;
    }

    private rotation: number = 0;
    public update(dt: number): void
    {
        const up = new Vector3(0, 1, 0);
        this.rotation = (this.rotation + dt  * Math.PI) % (Math.PI * 2);

        this.meshes.forEach(mesh =>
        {
            mesh.setRotationFromAxisAngle(up, this.rotation);
        });
    }

    public render(renderer: WebGLRenderer): void
    {
        renderer.render(this.scene, this.editor.sketchblocks.camera, undefined, true);
    }

    public onMouseDown(event: MouseEvent): boolean
    {
        const [mx, my] = this.editor.sketchblocks.getMousePosition(event);
        const mouse = new Vector2();
        mouse.set(mx * 2 - 1, -my * 2 + 1);

        const raycaster = new Raycaster();
        raycaster.setFromCamera(mouse, this.editor.sketchblocks.camera);

        var intersects = raycaster.intersectObjects(this.group.children, true);

        if (intersects.length > 0)
        {
            const design = intersects[0].object.userData.design as number;

            if (this.onDesignPicked)
            {
                this.onDesignPicked(design);
            }
            else
            {
                this.editor.sketchblocks.block = design;
            }
        }

        return true;
    }

    public onMouseUp(event: MouseEvent): boolean
    {
        return false;
    }

    public refresh(): void
    {
        this.meshes.forEach(mesh => this.group.remove(mesh));
        this.meshes.length = 0;

        const designs = this.editor.sketchblocks.project.blocksets[0].designs;
        const material = this.editor.sketchblocks.testMaterial;
        const up = new Vector3(0, 1, 0);

        designs.forEach((design, i) =>
        {
            const mesh = new Mesh(design.geometry, material);
            mesh.userData.design = i;
            this.group.add(mesh);
            this.meshes.push(mesh);

            mesh.setRotationFromAxisAngle(up, this.rotation);
            mesh.position.setX((i - 2.5) * 2);
        });
    }

    public show(): void
    {
        this.sidebar.hidden = false;
        this.group.visible = true;

        this.editor.setThree();
        this.editor.sketchblocks.threeLayers.push(this);
    }

    public hide(): void
    {
        this.sidebar.hidden = true;
        this.group.visible = false;
    }
}
