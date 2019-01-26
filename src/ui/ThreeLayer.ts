import { WebGLRenderer } from "three";

export default interface ThreeLayer
{
    onMouseDown(event: MouseEvent): boolean;
    onMouseUp(event: MouseEvent): boolean;
    onMouseMove(event: MouseEvent): boolean;
    
    update(dt: number): void;
    render(renderer: WebGLRenderer): void;
}
