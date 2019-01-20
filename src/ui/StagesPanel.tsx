import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as utility from '../tools/utility';

import Panel from "./Panel";
import FlicksyEditor from "./FlicksyEditor";

export default class StagesPanel implements Panel
{
    private readonly sidebar: HTMLElement;

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
}
