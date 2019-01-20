import { Vector3, PerspectiveCamera, Euler } from "three";

export default class PivotCamera
{
    public focus = new Vector3(0, 0);
    public angle = 0;
    public pitch = -Math.PI / 8;
    public distance = 12;
    
    public setCamera(camera: PerspectiveCamera): void
    {
        const position = new Vector3(0, 0, this.distance);
        const rotation = new Euler(this.pitch, this.angle, 0, "ZYX");
        
        position.applyEuler(rotation);

        camera.position.addVectors(position, this.focus);
        camera.lookAt(this.focus);
    }
}
