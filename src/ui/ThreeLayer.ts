import { WebGLRenderer } from "three";

export default interface ThreeLayer
{
    priority: number;

    onMouseDown(event: MouseEvent): boolean;
    onMouseUp(event: MouseEvent): boolean;
    
    update(dt: number): void;
    render(renderer: WebGLRenderer): void;
}
