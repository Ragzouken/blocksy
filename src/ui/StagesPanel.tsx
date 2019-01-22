import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as utility from '../tools/utility';

import Panel from "./Panel";
import FlicksyEditor from "./FlicksyEditor";
import ThreeLayer from './ThreeLayer';
import { WebGLRenderer, Scene, GridHelper, PerspectiveCamera, MOUSE } from 'three';
import { OrbitControls } from 'three-orbitcontrols-ts';
import PivotCamera from '../tools/PivotCamera';

export default class StagesPanel implements Panel, ThreeLayer
{
    private readonly sidebar: HTMLElement;

    // TODO: make private... move?
    public readonly camera: PerspectiveCamera;
    private readonly pivotCamera = new PivotCamera();
    private readonly orbitControls: OrbitControls;

    public readonly scene = new Scene();

    public constructor(private readonly editor: FlicksyEditor)
    {
        const sidebar = <>
            <div className="section">
                <h1>stages</h1>
                <p>build with blocks</p>
                <h2>controls</h2>
                AD - rotate camera<br/>
                WS - raise/lower camera<br/>
                QE - zoom camera<br/>
                ZX - rotate highlighted blocky
            </div>
        </>;

        const root = utility.getElement("sidebar");
        this.sidebar = document.createElement("div");
        root.appendChild(this.sidebar);

        ReactDOM.render(sidebar, this.sidebar);

        // camera
        // TODO: check aspect ratio
        this.camera = new PerspectiveCamera(45, 320 / 240, 1, 10000);
        this.camera.position.set(0, 8, 13);
        this.camera.lookAt(0, 0, 0);

        this.orbitControls = new OrbitControls(this.camera);
        this.orbitControls.mouseButtons.ORBIT = MOUSE.RIGHT;
        this.orbitControls.mouseButtons.PAN = MOUSE.MIDDLE;

        // grid renderer
        const gridRenderer = new GridHelper(16, 16);
        this.scene.add(gridRenderer);
    }

    public show(): void
    {
        this.editor.setThree();
        this.editor.sketchblocks.threeLayers.push(this);
        this.sidebar.hidden = false;

        this.refresh();
    }

    public hide(): void
    {
        this.sidebar.hidden = true;
    }

    public refresh(): void
    {
    }

    public update(dt: number): void
    {
        const keys = this.editor.sketchblocks.keys;

        if (keys.get("a"))
        {
            this.pivotCamera.angle -= Math.PI / 4 * dt;
        }

        if (keys.get("d"))
        {
            this.pivotCamera.angle += Math.PI / 4 * dt;
        }

        if (keys.get("w"))
        {
            this.pivotCamera.pitch -= Math.PI / 16 * dt;
        }

        if (keys.get("s"))
        {
            this.pivotCamera.pitch += Math.PI / 16 * dt;
        }

        if (keys.get("e"))
        {
            this.pivotCamera.distance += 8 * dt;
        }

        if (keys.get("q"))
        {
            this.pivotCamera.distance -= 8 * dt;
        }

        //this.pivotCamera.setCamera(this.camera);
        this.orbitControls.update();
    }

    public render(renderer: WebGLRenderer): void
    {
        this.camera.aspect = 320 / 200;
        this.camera.updateProjectionMatrix();

        renderer.render(this.scene, this.camera);
    }

    onMouseDown(event: MouseEvent): boolean 
    {
        return false;
    }

    onMouseUp(event: MouseEvent): boolean
    {
        return false;
    }
}
