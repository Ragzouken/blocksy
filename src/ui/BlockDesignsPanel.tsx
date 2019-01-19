import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as utility from '../tools/utility';
import FlicksyEditor from "./FlicksyEditor";
import Panel from "./Panel";
import { Group, Mesh, Vector3 } from 'three';

export default class BlockDesignsPanel implements Panel
{
    private readonly sidebar: HTMLElement;
    private readonly group = new Group();

    private readonly meshes: Mesh[] = [];

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

        editor.sketchblocks.scene.add(this.group);

        editor.pixi.ticker.add(dt => this.update(dt));
    }

    private rotation: number = 0;
    private update(dt: number): void
    {
        const up = new Vector3(0, 1, 0);
        this.rotation = (this.rotation + (dt / 60) * Math.PI) % (Math.PI * 2);

        this.meshes.forEach(mesh =>
        {
            mesh.setRotationFromAxisAngle(up, this.rotation);
        });
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
            this.group.add(mesh);
            this.meshes.push(mesh);

            mesh.setRotationFromAxisAngle(up, this.rotation);
            mesh.position.setX((i - 2.5) * 2).setY(4);
        });
    }

    public show(): void
    {
        this.sidebar.hidden = false;
        this.group.visible = true;
        this.editor.setThree();
    }

    public hide(): void
    {
        this.sidebar.hidden = true;
        this.group.visible = false;
    }
}
