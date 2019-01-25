import * as Pixi from 'pixi.js';
import { Scene } from '../data/Scene';
import { FlicksyProject } from '../data/FlicksyProject';
import { saveProject } from '../tools/saving';
import * as utility from '../tools/utility';
import DrawingBoardsPanel from './DrawingBoardsPanel';
import Panel from './Panel';
import PickerPanel from './PickerPanel';
import ProjectsPanel from './ProjectsPanel';
import PublishPanel from './PublishPanel';
import SceneMapsPanel from './SceneMapsPanel';
import ScenesPanel from './ScenesPanel';
import SketchblocksEditor from './SketchblocksEditor';
import StagesPanel from './StagesEditor';
import BlockDesignsPanel from './BlockDesignsPanel';
import BlocksyProject from '../data/BlocksyProject';

export default class FlicksyEditor
{
    public readonly pixi: Pixi.Application;

    public readonly projectsPanel: ProjectsPanel;
    public readonly publishPanel: PublishPanel;
    public readonly drawingBoardsPanel: DrawingBoardsPanel;
    public readonly scenesPanel: ScenesPanel;
    public readonly sceneMapsPanel: SceneMapsPanel;
    public readonly pickerPanel: PickerPanel;
    public readonly stagesPanel: StagesPanel;
    public readonly designsPanel: BlockDesignsPanel;

    public readonly sketchblocks: SketchblocksEditor;

    public project: FlicksyProject;

    private readonly returnToEditorButton: HTMLButtonElement;

    private readonly pixiCanvasContainer: HTMLElement;
    private readonly saveButton: HTMLButtonElement;

    private readonly pixiCanvas: HTMLCanvasElement;
    private readonly threeCanvas: HTMLCanvasElement;

    public constructor(private sidebarContainer: HTMLElement,
                       private canvasContainer: HTMLElement,
                       public resolution: [number, number],
                       public readonly blocksyProject: BlocksyProject)
    {
        this.pixiCanvasContainer = document.getElementById("container")! as HTMLDivElement;
        
        // transparent prevents flickering on silk browser
        this.pixi = new Pixi.Application(this.resolution[0], 
                                         this.resolution[1], 
                                         { transparent: true });

        this.canvasContainer = document.getElementById("pixi")!;
        this.canvasContainer.appendChild(this.pixi.view);
        this.pixi.start();

        this.pixiCanvas = this.pixi.view;
        

        // create all the other ui
        this.projectsPanel = new ProjectsPanel(this);
        this.publishPanel = new PublishPanel(this);
        this.drawingBoardsPanel = new DrawingBoardsPanel(this);
        this.scenesPanel = new ScenesPanel(this);
        this.sceneMapsPanel = new SceneMapsPanel(this);
        this.pickerPanel = new PickerPanel(this);
        this.stagesPanel = new StagesPanel(this);
        this.designsPanel = new BlockDesignsPanel(this);

        this.sketchblocks = new SketchblocksEditor(this);
        this.threeCanvas = this.sketchblocks.renderer.domElement;
        
        this.setActivePanel(this.stagesPanel);

        // tabs
        utility.buttonClick("editor-button",         () => this.enterEditor());
        utility.buttonClick("playtest-button",       () => this.enterPlayback(true));
        utility.buttonClick("info-tab-button",       () => this.setActivePanel(this.projectsPanel));
        utility.buttonClick("publish-tab-button",    () => this.setActivePanel(this.publishPanel));
        utility.buttonClick("drawing-tab-button",    () => this.setActivePanel(this.drawingBoardsPanel));
        utility.buttonClick("scene-tab-button",      () => this.setActivePanel(this.scenesPanel));
        utility.buttonClick("scene-maps-tab-button", () => this.setActivePanel(this.sceneMapsPanel));

        utility.getElement("playtest-button").hidden = true;
        utility.getElement("info-tab-button").hidden = true;
        utility.getElement("publish-tab-button").hidden = true;

        utility.buttonClick("stage-tab-button",  () => this.setActivePanel(this.stagesPanel));
        utility.buttonClick("design-tab-button", () => 
        {
            this.setActivePanel(this.designsPanel);
            this.designsPanel.startPickingBlock(design => {
                this.sketchblocks.block = design;
                this.setActivePanel(this.stagesPanel);
            })
        });  

        // editor vs playback
        this.returnToEditorButton = utility.getElement("editor-button");

        // save button
        this.saveButton = document.getElementById("save")! as HTMLButtonElement;
        this.saveButton.addEventListener("click", () => this.saveProject());

        // constantly ensure canvas size is correct
        this.pixi.ticker.add(() => this.resizeCanvases());
        // block normal html clicks
        this.pixi.view.onmousedown = (e) => e.preventDefault();
        this.pixi.view.oncontextmenu = (e) => e.preventDefault();

        // pass pointer move events to the various panels
        this.pixi.stage.interactive = true;
        this.pixi.stage.on("pointermove", (event: Pixi.interaction.InteractionEvent) => 
        {
            this.drawingBoardsPanel.updateDragging(event);
            this.scenesPanel.updateDragging(event);
        });
    }

    /**
     * Set the project that should be displayed and editable within this UI
     * @param project The project the editor should operate on
     */
    public setProject(project: FlicksyProject): void
    {
        this.project = project;

        // default to the first drawing board and first palette colour
        this.drawingBoardsPanel.setDrawingBoard(project.drawingBoards[0]);
        this.drawingBoardsPanel.setBrushColor(1);
        
        // default to the first scene
        this.scenesPanel.setScene(project.scenes[0]);

        // first scene map
        this.sceneMapsPanel.setMap(project.sceneBoards[0]);

        const drawing = this.drawingBoardsPanel.createNewDrawing(4 * 16, 4 * 16);
        drawing.drawing.texture = this.sketchblocks.project.blocksets[0].texture;

        for (let y = 0; y < 8; ++y)
        {
            for (let x = 0; x < 8; ++x)
            {
                const tile1 = this.drawingBoardsPanel.createNewDrawing(16, 16);
                tile1.drawing.texture = drawing.drawing.texture;
                tile1.drawing.sprite = {x: x * 16, y: y * 16, w:16, h:16};
                tile1.position.x = x * 20;
                tile1.position.y = y * 20;
            }
        }

        this.refresh();
    }

    /**
     * Force all UI to refresh to reflect the current project state.
     */
    public refresh(): void
    {
        this.projectsPanel.refresh();
        this.publishPanel.refresh();
        this.drawingBoardsPanel.refresh();
        this.scenesPanel.refresh();
        this.sceneMapsPanel.refresh();

        this.stagesPanel.refresh();
        this.designsPanel.refresh();

        this.resolution = [160, 100];
        this.resizeCanvases();
    }

    /**
     * Switch the UI to playback mode: hide the sidebar, open the first scene
     * in the project, and set the scene UI to playback mode. Optionally 
     * displays a button to re-enter editor mode.
     * @param escapable Show the button to re-enter editor mode
     */
    public enterPlayback(escapable: boolean): void
    {
        this.returnToEditorButton.hidden = !escapable;
        this.sidebarContainer.hidden = true;

        this.setActivePanel(this.scenesPanel);

        this.scenesPanel.setScene(this.project.getSceneByUUID(this.project.startScene)!);
        this.scenesPanel.setPlayTestMode(true);
    }

    /**
     * Switch the UI to editor mode, which displays the sidebar.
     */
    public enterEditor(): void
    {
        this.returnToEditorButton.hidden = true;
        this.sidebarContainer.hidden = false;
        this.scenesPanel.setPlayTestMode(false);
    }

    public openScene(scene: Scene): void
    {
        this.scenesPanel.setScene(scene);
        this.setActivePanel(this.scenesPanel);
    }

    public openSceneMap(selected: Scene | undefined): void
    {
        const pin = this.project.sceneBoards[0].pins.find(p => p.element === selected);
        this.sceneMapsPanel.select(pin);
        this.setActivePanel(this.sceneMapsPanel);
    }

    public setPixi(): void
    {
        this.pixiCanvas.hidden = false;
        //this.threeCanvas.hidden = true;
    }

    public setThree(): void
    {
        this.pixiCanvas.hidden = true;
        this.threeCanvas.hidden = false;
    }

    public hideAll(): void
    {
        this.setPixi();

        this.projectsPanel.hide();
        this.drawingBoardsPanel.hide();
        this.scenesPanel.hide();
        this.sceneMapsPanel.hide();
        this.publishPanel.hide();
        this.pickerPanel.hide();

        this.sketchblocks.threeLayers.length = 0;
        this.stagesPanel.hide();
        this.designsPanel.hide();
    }

    /**
     * Return the position of the mouse in the coordinate space of the the
     * canvas.
     */
    public getMousePositionView(): Pixi.Point
    {
        return this.pixi.renderer.plugins.interaction.mouse.global as Pixi.Point;
    }

    /**
     * Hide all sidebar panels and then show the given one.
     * @param panel The sidebar panel that should be shown
     */
    private setActivePanel(panel: Panel): void
    {
        this.hideAll();
        panel.show();
    }

    /**
     * Save the open project. Displays visual feedback on the save button
     * itself and disables the save button during the process.
     */
    private async saveProject(): Promise<void>
    {
        // prevent saving while already saving
        this.saveButton.disabled = true;
        this.saveButton.textContent = "saving..."

        // guaranteed saving takes enough time to see that it happened
        const delay = utility.delay(500);
        await saveProject(this.sketchblocks.project);
        await delay;

        // show saved confirmation briefly
        this.saveButton.textContent = "saved!";
        await utility.delay(200);

        // restore save button to natural state
        this.saveButton.textContent = "save";
        this.saveButton.disabled = false;
    }

    private resizeCanvases(): void
    {
        this.resizePixiCanvas();
        this.resizeThreeCanvas();
    }

    private resizeThreeCanvas(): void
    {
        // TODO: need to center viewport correctly
        const w = 320;
        const h = 200;

        this.sketchblocks.renderer.setSize(w, h, false);
        //this.renderer.setViewport(10, 10, 320, 240);
    }

    /** 
     * Resize the canvas and update the pixi renderer so that the scene frame
     * fills the entire space with the correct aspect ratio and a small margin.
     */
    private resizePixiCanvas(): void
    {
        const w = this.pixiCanvasContainer.clientWidth;
        const h = this.pixiCanvasContainer.clientHeight; 

        // this part resizes the canvas but keeps ratio the same    
        this.pixi.renderer.view.style.width = w + "px";    
        this.pixi.renderer.view.style.height = h + "px";    
        
        // this part adjusts the ratio:    
        this.pixi.renderer.resize(w,h);

        const [referenceWidth, referenceHeight] = this.resolution;
        const margin = 4;

        const scale = Math.min(w / (referenceWidth  + margin), 
                                h / (referenceHeight + margin));
        // const scale = Math.floor(Math.min(w / referenceWidth, h / referenceHeight));

        this.pixi.stage.scale = new Pixi.Point(scale, scale);
        this.pixi.stage.position = new Pixi.Point(w / 2, h / 2);
    }
}
