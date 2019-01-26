import { WebGLRenderer, PerspectiveCamera, Scene, Color, Vector3, Clock, Vector2, Euler, Material, CanvasTexture, ClampToEdgeWrapping, NearestFilter, MeshBasicMaterial, Mesh, Raycaster, BoxBufferGeometry, Object3D, PlaneBufferGeometry, CubeGeometry, GridHelper, AmbientLight, DirectionalLight, Texture, BufferGeometry, BufferAttribute, LineBasicMaterial, Line } from 'three';
import { getElement } from '../tools/utility';
import StageView from './StageView';
import FlicksyEditor from './FlicksyEditor';
import { createBlankProject } from '../tools/ProjectTools';
import BlocksyProject from '../data/BlocksyProject';
import ThreeLayer from './ThreeLayer';

export default class SketchblocksEditor
{
    public readonly clock: Clock;
    public readonly renderer: WebGLRenderer;
    public readonly scene: Scene;

    public readonly stageView: StageView;

    public readonly keys = new Map<string, boolean>();

    public block = 0;

    public project: BlocksyProject;

    public threeLayers: ThreeLayer[] = [];

    public constructor(readonly editor2: FlicksyEditor)
    {
        //
        this.clock = new Clock();

        // keys
        const keydown = (event: any) =>
        {
            this.keys.set(event.key, true);

            if (event.key === "z")
            {
                const block = this.stageView.stage.getBlock(this.editor2.stagesPanel.selectPosition);

                if (block)
                {
                    block.orientation += 1;
                    this.stageView.refreshBlock(block);
                }
            }

            if (event.key === "x")
            {
                const block = this.stageView.stage.getBlock(this.editor2.stagesPanel.selectPosition);

                if (block)
                {
                    block.orientation -= 1;
                    this.stageView.refreshBlock(block);
                }
            }
        }

        const keyup = (event: any) =>
        {
            this.keys.set(event.key, false);
        }

        document.addEventListener('keydown', keydown, false);
        document.addEventListener('keyup', keyup, false);

        // canvas
        window.addEventListener('resize', () => this.resizeThreeCanvas(), false);

        // renderer
        this.renderer = new WebGLRenderer({ antialias: false });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.autoClear = false;
        getElement("three").appendChild(this.renderer.domElement);
        
        this.resizeThreeCanvas();

        this.scene = new Scene();
        this.scene.background = new Color(.1, .1, .1);

        this.animate();

        this.project = this.editor2.blocksyProject; //createBlankProject();

        // test stage
        this.stageView = new StageView(this.editor2.stagesPanel);
        this.stageView.setStage(this.project.stages[0]);

        // mouse
        document.addEventListener('mousemove', event => this.onDocumentMouseMove(event), false);
        document.addEventListener('mousedown', event => this.onDocumentMouseDown(event), false);
        window.addEventListener("blur", event => this.keys.clear());
    }

    public animate(): void
    {
        requestAnimationFrame(() => this.animate());
        
        this.update(this.clock.getDelta());
        this.render();
    }

    public update(dt: number): void
    {
        this.threeLayers.forEach(layer => layer.update(dt));
    }

    public render(): void
    {
        this.renderer.clear();
        this.renderer.render(this.scene, this.editor2.stagesPanel.camera);
        this.threeLayers.forEach(layer => layer.render(this.renderer));
    }

    private resizeThreeCanvas(): void
    {
        // TODO: need to center viewport correctly
        const w = 320;
        const h = 200;
    
        this.renderer.setSize(w, h, false);
        //this.renderer.setViewport(10, 10, 320, 240);
    }

    public getMousePosition(event: any): [number, number]
    {
        // e = Mouse click event.
        var rect = event.target.getBoundingClientRect();
        var x = event.clientX - rect.left; //x position within the element.
        var y = event.clientY - rect.top;  //y position within the element.

        return [x / rect.width, y / rect.height];
    }

    private onDocumentMouseMove(event: MouseEvent)
    {
        if (event.target !== this.renderer.domElement) return;

        for (let i = this.threeLayers.length - 1; i >= 0; --i)
        {
            const cancel = this.threeLayers[i].onMouseMove(event);

            if (cancel) 
            {
                event.preventDefault();
                return;
            }
        }
    }

    private onDocumentMouseDown(event: MouseEvent) 
    {
        if (event.target !== this.renderer.domElement) return;
        if (event.button !== 0) return;

        for (let i = this.threeLayers.length - 1; i >= 0; --i)
        {
            if (this.threeLayers[i].onMouseDown(event)) 
            {
                event.preventDefault();
                return;
            }
        }
    }
}
