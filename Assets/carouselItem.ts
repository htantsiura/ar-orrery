import { LSTween } from "LSTween.lspkg/LSTween";
import Easing from "LSTween.lspkg/TweenJS/Easing";

@component
export class carouselItem extends BaseScriptComponent 

{
    @input
    itemBody: BodyComponent

    @input
    button: ScriptComponent

    @input
    circle: RenderMeshVisual

    @input
    itemIndexText: Text

    @input
    defaultMat: Material

    @input
    activeMat: Material

    @input
    scaleCoef: number

    public animTime: number = 250;
    private colorDefaultValue: number = 0.4
    private colorActiveValue: number = 1.0
    private myMatPass: any
    private startScale: vec3
    private activeScale: vec3
    private _index: number
    public activeIndex: number


    onAwake() {
        this.myMatPass = this.activeMat.mainPass
        this.circle.getSceneObject().enabled = false;
        this.startScale = this.itemBody.getSceneObject().getTransform().getLocalScale()
        this.activeScale = new vec3(this.startScale.x * this.scaleCoef, this.startScale.y * this.scaleCoef, this.startScale.z * this.scaleCoef)

        this.setupCollisionEvents()
    }

    public setupIndex(index: number) {
        this._index = index;
        if (this.itemIndexText) {
            this.itemIndexText.text = index.toString()
        }
    }

    public get index(): number {
        return this._index
    }

    private setupCollisionEvents(): void {
        this.itemBody.onCollisionEnter.add(this.collisionStart.bind(this));
        this.itemBody.onCollisionStay.add(this.collisionActive.bind(this));
        this.itemBody.onCollisionExit.add(this.collisionStop.bind(this));
    }

    private collisionStart(eventArgs: CollisionEnterEventArgs) {
        this.activeMat.mainPass.colorChanger = 0;
        this.circle.getSceneObject().enabled = true;
        this.tweenIconColor(this.myMatPass, "colorChanger", 0, 1, this.animTime)
        this.tweenIconScale(this.itemBody.getSceneObject(), this.startScale, this.activeScale, this.animTime)
        this.activeIndex = this._index
    }

    private collisionActive(eventArgs: CollisionStayEventArgs) {
        // print("collision active " + this.intruderName);
    }

    private collisionStop(eventArgs: CollisionExitEventArgs) {
        this.circle.getSceneObject().enabled = false;
        this.tweenIconScale(this.itemBody.getSceneObject(), this.activeScale, this.startScale, this.animTime)
    }

    private tweenIconColor(myPass, scriptName, a, b, t): void {
        LSTween.shaderFloatPropertyFromTo(
            myPass, 
            scriptName, //"green", 
            a, 
            b, 
            t
        )
        .easing(Easing.Quadratic.Out) //InOut
        // .onComplete(() => this.checkAndSetMaterial())
        .start();
    }

    public changeIconColorToHover(): void {
        let myPassDefault = this.defaultMat.mainPass
        let myPassActive = this.activeMat.mainPass
        this.tweenIconColor(myPassDefault, "alpha", 0.3, 1, this.animTime * 2)
        this.tweenIconColor(myPassActive, "alpha", 0.3, 1, this.animTime * 2)
    }

    public changeIconColorToIdle(): void {
        let myPassDefault = this.defaultMat.mainPass
        let myPassActive = this.activeMat.mainPass
        this.tweenIconColor(myPassDefault, "alpha", 1, 0.3, this.animTime * 2)
        this.tweenIconColor(myPassActive, "alpha", 1, 0.3, this.animTime * 2)
    }

    private tweenIconScale(object, startScale, finalScale, t): void {

        LSTween.scaleFromToLocal(
            object.getTransform(),
            startScale,
            finalScale,
            t
        )
        .easing(Easing.Cubic.Out) //InOut)
        .delay(0) // There is a bug in TweenJS where the yoyo value will jump if no delay is set.
        .yoyo(false)
        .repeat()
        .start();
    }


}
