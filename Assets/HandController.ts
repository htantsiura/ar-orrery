
export enum Handstate {
    Idle = 0,
    Hovering = 1,
    Rotating = 2
}

@component
export class HandController extends BaseScriptComponent 

{
    @input
    sphereFinger0: SceneObject

    @input
    sphereFinger1: SceneObject

    @input
    handRotatedBox: SceneObject

    @input
    root: SceneObject

    

    private hoverTreshold: number = 7
    private fingersTreshold: number = 11
    private _currentState = Handstate.Idle
    private _startRotQuat: quat
    private _finalRotQuat: quat
    private _currentRotQuat: quat
    private _deltaRotQuat: quat
    private _startRotAngle: number
    private _currentRotAngle: number = 0

    private flagStartRotCaptured: Boolean = false
    private flagFinalRotCaptured: Boolean = true



    onAwake() {

        this.createEvent("UpdateEvent").bind(() => {
            this.calculateState()
        })
    }

    private findDistanceBetweenPoints(a, b): number {
        var distance = a.distance(b);
        return distance;
    }

    private calculateState(): void {

        var pointA = this.sphereFinger0.getTransform().getWorldPosition();
        var pointB = this.sphereFinger1.getTransform().getWorldPosition();
        var pointHand = pointA.add(pointB).uniformScale(0.5)
        var pointCarousel = this.root.getTransform().getWorldPosition();

        var fingersDistance = this.findDistanceBetweenPoints(pointA, pointB);
        var hoveringDistance = this.findDistanceBetweenPoints(pointHand, pointCarousel);


        this.handRotatedBox.getTransform().setWorldPosition(pointHand)

        if (hoveringDistance > this.hoverTreshold) {
            this.flagStartRotCaptured = false
            this.flagFinalRotCaptured = true

            this._currentState = Handstate.Idle
            return
        } 
        else if (hoveringDistance <= this.hoverTreshold && fingersDistance > this.fingersTreshold) {
            this._currentState = Handstate.Hovering
            if (!this.flagFinalRotCaptured) {
                this.flagStartRotCaptured = false
                this.flagFinalRotCaptured = true
            }  
        } 
        else {
            this._currentState = Handstate.Rotating
            if (!this.flagStartRotCaptured) {
                this._startRotQuat = this.handRotatedBox.getTransform().getWorldRotation()
                this.flagStartRotCaptured = true
                this.flagFinalRotCaptured = false
            }

            this._currentRotQuat = this.handRotatedBox.getTransform().getWorldRotation()
            this._deltaRotQuat = this._startRotQuat.invert().multiply(this._currentRotQuat)
            this._currentRotAngle = this._deltaRotQuat.toEulerAngles().z
        }
    }

    // calculate angle for return
            // if(this._currentRotAngle > Math.PI) {
            //     var rotatedNegativeAngle = (Math.round((this._currentRotAngle - 2 * Math.PI) * 100)) / 100 * this.handSensitivity
            //     return rotatedNegativeAngle;
            // } else {
            //     var rotatedPositiveAngle = (Math.round(this._currentRotAngle * 100)) / 100 * this.handSensitivity
            //     return rotatedPositiveAngle
            // }

    public get state(): Handstate {
        return this._currentState;
    }

    // Менеджер будет читать это, чтобы знать, на сколько крутить
    public get rotationAngle(): number {
        return this._currentRotAngle;
    }
}
