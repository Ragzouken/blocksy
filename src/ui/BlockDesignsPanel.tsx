import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as utility from '../tools/utility';
import FlicksyEditor from "./FlicksyEditor";
import Panel from "./Panel";
import { Group, Mesh, Vector3, WebGLRenderer, Scene, Raycaster, Vector2, OrthographicCamera } from 'three';
import ThreeLayer from './ThreeLayer';

export default class BlockDesignsPanel implements Panel, ThreeLayer
{
    private readonly sidebar: HTMLElement;
    private readonly group = new Group();

    private readonly meshes: Mesh[] = [];

    private onDesignPicked: (design: number) => void | undefined;

    private readonly scene = new Scene();
    private readonly camera: OrthographicCamera;

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

        const scale = 1 / 2;

        this.scene.add(this.group);
        this.camera = new OrthographicCamera(-16 * scale, 16 * scale, 10 * scale, -10 * scale);
        this.camera.position.set(0, 0, -1);
        this.camera.lookAt(0, 0, 0);
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
        this.rotation = (this.rotation + dt  * Math.PI) % (Math.PI * 4);

        this.meshes.forEach(mesh =>
        {
            mesh.setRotationFromAxisAngle(up, this.rotation);
            mesh.rotateOnWorldAxis(new Vector3(1, 0, 0), this.rotation * .5);
        });
    }

    public render(renderer: WebGLRenderer): void
    {
        renderer.render(this.scene, this.camera, undefined, true);
    }

    public onMouseDown(event: MouseEvent): boolean
    {
        const [mx, my] = this.editor.sketchblocks.getMousePosition(event);
        const mouse = new Vector2();
        mouse.set(mx * 2 - 1, -my * 2 + 1);

        const raycaster = new Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

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

    public onMouseMove(event: MouseEvent): boolean
    {
        return false;
    }

    public refresh(): void
    {
        this.meshes.forEach(mesh => this.group.remove(mesh));
        this.meshes.length = 0;

        const blockset = this.editor.sketchblocks.project.blocksets[0];
        const up = new Vector3(0, 1, 0);

        blockset.designs.forEach((design, i) =>
        {
            const mesh = new Mesh(design.geometry, blockset.material);
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
