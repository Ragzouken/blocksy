import { WebGLRenderer, PerspectiveCamera, Scene, Color, Vector3, Clock, Vector2, Euler, Material, CanvasTexture, ClampToEdgeWrapping, NearestFilter, MeshBasicMaterial, Mesh, Raycaster, BoxBufferGeometry, Object3D, PlaneBufferGeometry, CubeGeometry, GridHelper, AmbientLight, DirectionalLight, Texture } from 'three';
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
    public readonly camera: PerspectiveCamera;
    public readonly scene: Scene;

    private readonly stageView: StageView;

    public readonly keys = new Map<string, boolean>();

    public block = 0;

    public testTexture: CanvasTexture;
    public testMaterial: Material;

    public project: BlocksyProject;

    private readonly testCursorCube: Mesh;
    private readonly testPlaceCube: Mesh;
    private readonly testObjects: Object3D[] = [];

    private readonly gridCollider: Mesh;
    private readonly cubeCollider: Mesh;

    private cursorPosition = new Vector3(0, 0, 0);
    private placePosition = new Vector3(0, 0, 0);

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
                const id = this.cursorPosition.toArray().join(",");
                const block = this.stageView.stage.blocks.get(id);

                if (block)
                {
                    block.orientation += 1;
                    this.stageView.refreshBlock(block);
                }
            }

            if (event.key === "x")
            {
                const id = this.cursorPosition.toArray().join(",");
                const block = this.stageView.stage.blocks.get(id);

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

        // camera
        // TODO: check aspect ratio
        this.camera = new PerspectiveCamera(45, 320 / 240, 1, 10000);
        this.camera.position.set(0, 8, 13);
        this.camera.lookAt(0, 0, 0);
        
        this.resizeThreeCanvas();

        this.scene = new Scene();
        this.scene.background = new Color(.1, .1, .1);

        this.animate();

        const texsize = 16;

        this.project = createBlankProject();

        this.testTexture = new CanvasTexture(this.project.blocksets[0].texture.canvas, 
                                          undefined, 
                                          ClampToEdgeWrapping,
                                          ClampToEdgeWrapping, 
                                          NearestFilter, 
                                          NearestFilter);

        this.testMaterial = new MeshBasicMaterial({ color: 0xffffff, map: this.testTexture });
        this.testTexture.needsUpdate = true;
        this.project.blocksets[0].texture.canvas.addEventListener("flush", () => this.testTexture.needsUpdate = true);

        // test stage
        this.stageView = new StageView(this);
        this.stageView.setStage(this.project.stages[0]);

        // cursor
        const cursorGeometry = new BoxBufferGeometry(1.1, 1.1, 1.1);
        const cursorMaterial = new MeshBasicMaterial({ color: 0xffFFFF, opacity: 0.5, transparent: true })
        this.testCursorCube = new Mesh(cursorGeometry, cursorMaterial);
        this.scene.add(this.testCursorCube);

        const placeGeometry = new BoxBufferGeometry(.3, .3, .3);
        const placeMaterial = new MeshBasicMaterial({ color: 0xffFFFF, opacity: 0.9, transparent: true })
        this.testPlaceCube = new Mesh(placeGeometry, placeMaterial);
        this.scene.add(this.testPlaceCube);

        // floor
        const gridColliderGeometry = new PlaneBufferGeometry(16, 16);
        gridColliderGeometry.rotateX(-Math.PI/2);
        this.gridCollider = new Mesh(gridColliderGeometry, new MeshBasicMaterial({ visible: false }));
        this.scene.add(this.gridCollider);
        this.testObjects.push(this.gridCollider);

        // cube
        this.cubeCollider = new Mesh(new CubeGeometry(1, 1, 1), 
                            new MeshBasicMaterial({ visible: false }));
        this.scene.add(this.cubeCollider);

        // mouse
        document.addEventListener('mousemove', event => this.updateCursor(event), false);
        document.addEventListener('mousedown', event => this.onDocumentMouseDown(event), false);
        window.addEventListener("blur", event => this.keys.clear());

        // lights
        /*
        const ambientLight = new AmbientLight(0x606060);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff);
        directionalLight.position.set(1, 0.75, 0.5).normalize();
        this.scene.add(directionalLight);
        */
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
        this.renderer.render(this.scene, this.camera);

        this.threeLayers.forEach(layer => layer.render(this.renderer));
    }

    public testMakeBlock(): Mesh
    {
        return new Mesh(this.stageView.stage.blockset.designs[this.block % 2].geometry, this.testMaterial);
    }

    private resizeThreeCanvas(): void
    {
        // TODO: need to center viewport correctly
        const w = 320;
        const h = 200;

        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize(w, h, false);
        //this.renderer.setViewport(10, 10, 320, 240);
    }

    private updateCursor(event: MouseEvent): void
    {
        if (event.target !== this.renderer.domElement) return;

        event.preventDefault();
        const [mx, my] = this.getMousePosition(event);
        const mouse = new Vector2();
        //event.target.width
        mouse.set(mx * 2 - 1, -my * 2 + 1);

        const raycaster = new Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        var intersects = raycaster.intersectObjects([this.gridCollider, this.stageView.group], true);

        if (intersects.length > 0)
        {
            var intersect = intersects[ 0 ];

            if (intersect.object === this.gridCollider)
            {
                const p = this.scene.worldToLocal(intersect.point);

                this.cursorPosition.copy(p).floor().setY(-1);
                this.placePosition.copy(this.cursorPosition).setY(0);
                this.testCursorCube.visible = true;
            }
            else
            {
                this.cubeCollider.position.copy(intersect.object.position);
                const intersects2 = raycaster.intersectObject(this.cubeCollider);
                const intersect2 = intersects2[0];

                if (intersect2)
                {
                    this.cursorPosition.copy(intersect2.object.position).floor();
                    this.placePosition.copy(this.cursorPosition).add(intersect2.face!.normal);
                    this.testCursorCube.visible = true;
                    this.testPlaceCube.visible = true;
                }
                else
                {
                    this.testPlaceCube.visible = false;
                }
            }
        }
        else
        {
            this.testCursorCube.visible = false;
        }

        const id = this.placePosition.toArray().join(",");
        if (this.stageView.stage.blocks.get(id))
        {
            this.testPlaceCube.visible = false;
        }

        this.testCursorCube.position.copy(this.cursorPosition).addScalar(.5);
        this.testPlaceCube.position.copy(this.placePosition).addScalar(.5);
    }

    public getMousePosition(event: any): [number, number]
    {
        // e = Mouse click event.
        var rect = event.target.getBoundingClientRect();
        var x = event.clientX - rect.left; //x position within the element.
        var y = event.clientY - rect.top;  //y position within the element.

        return [x / rect.width, y / rect.height];
    }

    private onDocumentMouseDown(event: any) 
    {
        if (event.target !== this.renderer.domElement) return;

        for (let i = this.threeLayers.length - 1; i >= 0; --i)
        {
            if (this.threeLayers[i].onMouseDown(event)) 
            {
                event.preventDefault();
                return;
            }
        }

        if (!this.testPlaceCube.visible) return;

        event.preventDefault();

        const id = this.placePosition.toArray().join(",");
        const block =  {
            designID: this.block,
            orientation: 0,
            position: this.placePosition.clone(),
        };
        this.stageView.stage.blocks.set(id, block);
        this.stageView.refresh();
    }
}
