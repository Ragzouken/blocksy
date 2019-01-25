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

    private readonly stageView: StageView;

    public readonly keys = new Map<string, boolean>();

    public block = 0;

    public project: BlocksyProject;

    private readonly testPlaceCube: Mesh;
    private readonly testObjects: Object3D[] = [];

    private readonly gridCollider: Mesh;
    private readonly cubeCollider: Mesh;

    private cursorPosition = new Vector3(0, 0, 0);
    private placePosition = new Vector3(0, 0, 0);

    public threeLayers: ThreeLayer[] = [];

    private testLine: BufferGeometry;

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
        
        this.resizeThreeCanvas();

        this.scene = new Scene();
        this.scene.background = new Color(.1, .1, .1);

        this.animate();

        this.project = this.editor2.blocksyProject; //createBlankProject();

        // test stage
        this.stageView = new StageView(this.editor2.stagesPanel);
        this.stageView.setStage(this.project.stages[0]);

        // cursor
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

        // line
        this.testLine = new BufferGeometry();
        this.testLine.addAttribute('position', new BufferAttribute( new Float32Array( 4 * 4 ), 3 ) );
        const material = new LineBasicMaterial( { color: 0x00ffff, depthTest: false, transparent: true } );
        const line = new Line(this.testLine, material);
        line.renderOrder = 100;
        this.editor2.stagesPanel.scene.add(line);
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

    private updateCursor(event: MouseEvent): void
    {
        if (event.target !== this.renderer.domElement) return;

        event.preventDefault();
        const [mx, my] = this.getMousePosition(event);
        const mouse = new Vector2();
        //event.target.width
        mouse.set(mx * 2 - 1, -my * 2 + 1);

        const raycaster = new Raycaster();
        raycaster.setFromCamera(mouse, this.editor2.stagesPanel.camera);

        var intersects = raycaster.intersectObjects([this.gridCollider, this.stageView.group], true);

        if (intersects.length > 0)
        {
            var intersect = intersects[ 0 ];

            if (intersect.object === this.gridCollider)
            {
                const p = this.scene.worldToLocal(intersect.point);

                this.cursorPosition.copy(p).floor().setY(-1);
                this.placePosition.copy(this.cursorPosition).setY(0);
                this.editor2.stagesPanel.cursor.visible = true;
            }
            else
            {
                this.cubeCollider.position.copy(intersect.object.position);
                const intersects2 = raycaster.intersectObject(this.cubeCollider);
                const intersect2 = intersects2[0];

                if (intersect2)
                {
                    const id = this.cursorPosition.toArray().join(",");
                    const block = this.stageView.stage.blocks.get(id)!;
                    
                    if (block)
                    {
                        const design = this.stageView.stage.blockset.designs[block.designID];
                        const linePosition = this.testLine.attributes.position as BufferAttribute;
                        const meshPosition = design.geometry.attributes.position as BufferAttribute;
                        const face = intersect.face!;

                        const faceID = design.shape.tri2face[intersect.faceIndex!];

                        let indices = design.shape.faces.get(faceID)!; 

                        if (indices)
                        {
                            indices = indices.filter((v, i, s) => s.indexOf(v) === i);

                            for (let i = 0; i < 4; ++i)
                            {
                                linePosition.copyAt(i, meshPosition, indices[0]);
                            }

                            for (let i = 0; i < indices.length; ++i)
                            {
                                linePosition.copyAt(i, meshPosition, indices[i]);
                            }

                            linePosition.copyAt(4, meshPosition, indices[0]);

                            this.testLine.applyMatrix(this.stageView.blocks.get(block)!.mesh.matrix);
                        }
                    }

                    this.cursorPosition.copy(intersect2.object.position).floor();
                    this.placePosition.copy(this.cursorPosition).add(intersect2.face!.normal);
                    this.editor2.stagesPanel.cursor.visible = true;
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
            this.editor2.stagesPanel.cursor.visible = false;
        }

        const id = this.placePosition.toArray().join(",");
        if (this.stageView.stage.blocks.get(id))
        {
            this.testPlaceCube.visible = false;
        }

        this.editor2.stagesPanel.cursor.position.copy(this.cursorPosition).addScalar(.5);
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
