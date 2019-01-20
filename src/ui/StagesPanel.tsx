import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as utility from '../tools/utility';

import Panel from "./Panel";
import FlicksyEditor from "./FlicksyEditor";
import ThreeLayer from './ThreeLayer';
import { WebGLRenderer } from 'three';
import PivotCamera from '../tools/PivotCamera';

export default class StagesPanel implements Panel, ThreeLayer
{
    private readonly sidebar: HTMLElement;

    private readonly pivotCamera = new PivotCamera();

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

        this.pivotCamera.setCamera(this.editor.sketchblocks.camera);
    }

    public render(renderer: WebGLRenderer): void
    {

    }

    onMouseDown(event: MouseEvent): boolean 
    {
        throw new Error("Method not implemented.");
    }

    onMouseUp(event: MouseEvent): boolean
    {
        throw new Error("Method not implemented.");
    }
}
