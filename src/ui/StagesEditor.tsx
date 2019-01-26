import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as utility from '../tools/utility';

import Panel from "./Panel";
import FlicksyEditor from "./FlicksyEditor";
import ThreeLayer from './ThreeLayer';
import { WebGLRenderer, Scene, GridHelper, PerspectiveCamera, MOUSE, CanvasTexture, UVMapping, ClampToEdgeWrapping, NearestFilter, BoxBufferGeometry, MeshBasicMaterial, Mesh, DoubleSide, Vector2, Raycaster, Intersection, Skeleton, Vector3, Object3D, PlaneBufferGeometry, CubeGeometry, BufferAttribute, BufferGeometry, LineBasicMaterial, Line } from 'three';
import { OrbitControls } from 'three-orbitcontrols-ts';
import PivotCamera from '../tools/PivotCamera';
import { MTexture } from '../tools/MTexture';
import BlockDesign from '../data/BlockDesign';

enum EditorMode
{
    None,
    Block,
    Face,
}

export default class StagesEditor implements Panel, ThreeLayer
{
    private readonly sidebar: HTMLElement;

    // TODO: make private... move?
    public readonly camera: PerspectiveCamera;
    private readonly pivotCamera = new PivotCamera();
    private readonly orbitControls: OrbitControls;

    public readonly scene = new Scene();
    public readonly selectCursor: Mesh; // TODO: not public obv...
    public readonly createCursor: Mesh;

    private mode = EditorMode.None;
    private blockPanel = React.createRef<HTMLDivElement>();
    private facePanel = React.createRef<HTMLDivElement>();

    // raycast colliders
    private readonly gridCollider: Mesh;
    private readonly cubeCollider: Mesh;

    // cursors
    private readonly raycaster = new Raycaster();
    private readonly intersections: Intersection[] = [];

    public readonly selectPosition = new Vector3(); // TODO: private
    private readonly createPosition = new Vector3();

    private faceOutline: BufferGeometry;

    public constructor(private readonly editor: FlicksyEditor)
    {
        const sidebar = <>
            <div className="section">
                <h1>stages</h1>
                <p>build with blocks</p>
                <h2>controls</h2>
                left-click - place block<br/>
                right-click drag - rotate camera<br/>
                ZX - rotate highlighted block
            </div>

            <div className="line-tabs">
                <button onClick={() => this.setBlockMode()} title="???">blocks</button>
                <button onClick={() => this.setFaceMode()} title="???">faces</button>
            </div>

            <div className="section" ref={this.blockPanel}>
                <h1>Blocks</h1>
            </div>

            <div className="section" ref={this.facePanel}>
                <h1>Faces</h1>
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

        // raycast colliders
        const invisible = new MeshBasicMaterial({ visible: false });
        this.gridCollider = new Mesh(new PlaneBufferGeometry(16, 16).rotateX(-Math.PI/2), invisible);
        this.cubeCollider = new Mesh(new CubeGeometry(1, 1, 1), invisible);
        this.scene.add(this.gridCollider);
        this.scene.add(this.cubeCollider);

        // cursors
        const cursorTexture = new MTexture(16, 16);
        cursorTexture.fill(utility.rgb2num(255, 255, 255));
        cursorTexture.context.globalCompositeOperation = "destination-out";
        cursorTexture.context.strokeStyle = "#ffffff";
        //cursorTexture.context.globalAlpha = 0;
        cursorTexture.context.fillRect(2, 2, 12, 12);
        const cursorTexture3 = new CanvasTexture(cursorTexture.canvas, 
                                                 UVMapping,
                                                 ClampToEdgeWrapping,
                                                 ClampToEdgeWrapping,
                                                 NearestFilter,
                                                 NearestFilter);
        const cursorGeometry = new BoxBufferGeometry(1.1, 1.1, 1.1);
        const cursorMaterial = new MeshBasicMaterial({ color: 0xffffff,
                                                       map: cursorTexture3, 
                                                       alphaTest: .5, 
                                                       transparent: true,
                                                       side: DoubleSide });
        this.selectCursor = new Mesh(cursorGeometry, cursorMaterial);
        this.scene.add(this.selectCursor);

        const createGeometry = new BoxBufferGeometry(.3, .3, .3);
        const createMaterial = new MeshBasicMaterial({ color: 0xffFFFF })
        this.createCursor = new Mesh(createGeometry, createMaterial);
        this.scene.add(this.createCursor);

        // face outline
        this.faceOutline = new BufferGeometry();
        this.faceOutline.addAttribute('position', new BufferAttribute(new Float32Array(4 * 4), 3));
        const material = new LineBasicMaterial({ color: 0x00ffff, depthTest: false, transparent: true });
        const line = new Line(this.faceOutline, material);
        line.renderOrder = 100;
        this.scene.add(line);
    }

    public show(): void
    {
        this.setBlockMode();

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

    public setBlockMode(): void
    {
        this.mode = EditorMode.Block;
        this.blockPanel.current!.hidden = false;
        this.facePanel.current!.hidden = true;
    }

    public setFaceMode(): void
    {
        this.mode = EditorMode.Face;
        this.blockPanel.current!.hidden = true;
        this.facePanel.current!.hidden = false;
    }

    onMouseDown(event: MouseEvent): boolean 
    {
        if (this.mode === EditorMode.Block)
        {
            if (!this.createCursor.visible) return false;

            const block =  {
                designID: this.editor.sketchblocks.block,
                orientation: 0,
                position: this.createPosition.clone(),
            };

            this.editor.sketchblocks.stageView.stage.setBlock(block.position, block);
            this.editor.sketchblocks.stageView.refresh();
        }
        else if (this.mode === EditorMode.Face)
        {
            if (!this.hoveredDesign) return false;

            this.editor.setActivePanel(this.editor.drawingBoardsPanel);
            this.editor.drawingBoardsPanel.pickDrawingForScene(drawing =>
            {
                if (drawing && drawing.sprite && this.hoveredDesign)
                {
                    this.hoveredDesign.setFaceTile(this.hoveredFaceID,
                                                   this.editor.sketchblocks.stageView.stage.blockset,
                                                   drawing.tile);
                }

                this.editor.setThree();
                this.editor.setActivePanel(this);
            }, "pick tile");
        }

        return true;
    }

    onMouseUp(event: MouseEvent): boolean
    {
        return false;
    }

    onMouseMove(event: MouseEvent): boolean
    {
        this.selectCursor.visible = false;
        this.createCursor.visible = false;

        if (this.mode === EditorMode.Block)
        {
            return this.updateBlockCursor(event);
        }
        else if (this.mode === EditorMode.Face)
        {
            return this.updateFaceCursor(event);
        }

        return false;
    }

    private raycastFirstFromCamera(screen: Vector2, 
                                   objects: Object3D[]): Intersection | undefined
    {
        this.intersections.length = 0;
        this.raycaster.setFromCamera(screen, this.camera);
        this.raycaster.intersectObjects(objects, true, this.intersections);

        return this.intersections.length > 0 ? this.intersections[0] : undefined;
    }

    private updateBlockCursor(event: MouseEvent): boolean
    {
        const sketchblocks = this.editor.sketchblocks;

        const [mx, my] = sketchblocks.getMousePosition(event);
        const mouse = new Vector2();

        // why???
        mouse.set(mx * 2 - 1, -my * 2 + 1);

        this.selectCursor.visible = false;
        this.createCursor.visible = false;

        const intersection = this.raycastFirstFromCamera(mouse, [this.gridCollider, sketchblocks.stageView.group]);

        if (intersection)
        {
            if (intersection.object === this.gridCollider)
            {
                // show selection under the grid and create new blocks on the
                // surface of the grid
                const point = this.scene.worldToLocal(intersection.point);

                this.selectPosition.copy(point).floor().setY(-1);
                this.createPosition.copy(this.selectPosition).setY(0);

                this.createCursor.visible = true;
            }
            else
            {
                this.cubeCollider.position.copy(intersection.object.position);
                
                const intersect2 = this.raycastFirstFromCamera(mouse, [this.cubeCollider]);

                if (intersect2)
                {
                    this.selectPosition.copy(intersect2.object.position).floor();
                    this.createPosition.copy(this.selectPosition).add(intersect2.face!.normal);
                    this.selectCursor.visible = true;
                    this.createCursor.visible = true;
                }
            }
        }

        // hide placement cursor if block is occupied
        if (sketchblocks.stageView.stage.getBlock(this.createPosition))
        {
            this.createCursor.visible = false;
        }

        this.selectCursor.position.copy(this.selectPosition).addScalar(.5);
        this.createCursor.position.copy(this.createPosition).addScalar(.5);

        return true;
    }

    private hoveredDesign: BlockDesign | undefined;
    private hoveredFaceID: string;

    private updateFaceCursor(event: MouseEvent): boolean
    {
        this.hoveredDesign = undefined;

        const sketchblocks = this.editor.sketchblocks;

        const [mx, my] = sketchblocks.getMousePosition(event);
        const mouse = new Vector2();

        // why???
        mouse.set(mx * 2 - 1, -my * 2 + 1);

        const intersection = this.raycastFirstFromCamera(mouse, [this.gridCollider, sketchblocks.stageView.group]);

        if (!intersection || intersection.object === this.gridCollider) return true;

        this.cubeCollider.position.copy(intersection.object.position);
                
        const intersect2 = this.raycastFirstFromCamera(mouse, [this.cubeCollider]);

        if (intersect2)
        {
            const position = intersect2.object.position.clone().floor();
            const block = sketchblocks.stageView.stage.getBlock(position);
            
            if (block)
            {
                const design = sketchblocks.stageView.stage.blockset.designs[block.designID];
                const linePosition = this.faceOutline.attributes.position as BufferAttribute;
                const meshPosition = design.geometry.attributes.position as BufferAttribute;

                const faceID = design.shape.tri2face[intersection.faceIndex!];

                let indices = design.shape.faces.get(faceID)!; 

                this.hoveredDesign = design;
                this.hoveredFaceID = faceID;

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

                    this.faceOutline.applyMatrix(sketchblocks.stageView.blocks.get(block)!.mesh.matrix);
                }
            }
        }

        return true;
    }
}
