
import { LSTween } from "LSTween.lspkg/LSTween"
import Easing from "LSTween.lspkg/TweenJS/Easing"
import { carouselItem } from "./carouselItem"
import { HandController } from "./HandController"


@component
export class CarouselManager extends BaseScriptComponent 
{

    @input
    itemPrefab: ObjectPrefab

    @input
    root: SceneObject

    @input
    amountOfStates: number

    @input
    staticBody: BodyComponent

    @input
    stateText: Text

    @input
    casouselItemScript: carouselItem

    @input
    handControllerScript: HandController

    @input
    handSensitivity: number

    @input
    sound: AudioComponent

    @input
    debugText: Text

    @input
    debugText2: Text

    private stepAngle: number 
    private carouselItemScript: any
    private currentTweenRot: any
    private currentTweenScale: any
    private animTime: number = 500
    private deltaRotation: quat
    private currentRotation: quat
    private scaleCoef: number = 1.2
    private stateIndex: number 
    private lastNumOfSteps: number = 0
    private carouselState: number = 0
    private carouselDefaultScale: vec3
    private carouselActiveScale: vec3

    private flag_carouselWasDefault: Boolean = true
    private flag_carouselWasHover: Boolean = false
    private flag_carouselWasRotated: Boolean = false
    private startSessionStepIndex: number = 0
    private handRotationAngle: number
    

    onAwake() {
        this.stepAngle = Math.PI * 2 / this.amountOfStates
        this.currentRotation = this.root.getTransform().getLocalRotation();
        this.carouselDefaultScale = this.root.getTransform().getLocalScale()
        this.carouselActiveScale = new vec3(this.carouselDefaultScale.x * this.scaleCoef, this.carouselDefaultScale.y * this.scaleCoef, this.carouselDefaultScale.z * this.scaleCoef)


        this.debugText2.text = "start"
        this.spawnInstances()
        this.createCarousel()

        this.createEvent("UpdateEvent").bind(() => {
            this.carouselState = this.handControllerScript.state
            this.handRotationAngle = this.handControllerScript.rotationAngle
            this.carouselStateManager(this.carouselState)
        })

        this.setupCollisionEvents();
    }

    private spawnInstances(): void {
        for ( let i = 0; i < this.amountOfStates; i++) { 
            let instance = this.itemPrefab.instantiate(this.root)
            let itemScript = instance.getComponent(carouselItem.getTypeName()) // find script on my Prefab using getTypeName insted of "name")

            if (itemScript) {
                itemScript.setupIndex(i); // set index for every instance
            } else {
                print("No carouselItem found");
            } 
        }      
    }

    private createCarousel(): void {
        for ( let i = 1; i < this.amountOfStates; i++) {
            let itemRotationVec3 = new vec3(0, 0, this.stepAngle * i)
            let itemRotQuat = quat.fromEulerAngles(itemRotationVec3.x, itemRotationVec3.y, itemRotationVec3.z)
            this.deltaRotation = itemRotQuat;
            this.root.getChild(i).getTransform().setLocalRotation(itemRotQuat)
        }
    }

    private setupCollisionEvents(): void {
        this.staticBody.onCollisionEnter.add(this.collisionStart.bind(this));
        this.staticBody.onCollisionStay.add(this.collisionActive.bind(this));
        this.staticBody.onCollisionExit.add(this.collisionStop.bind(this));
    }

    private collisionStart(eventArgs: CollisionEnterEventArgs) {
        const collision = eventArgs.collision;
        this.carouselItemScript = collision.collider.getSceneObject().getParent().getComponent(carouselItem.getTypeName()) as carouselItem
       
        if (this.carouselItemScript) {
            this.stateIndex = this.carouselItemScript.index
            this.stateText.text = "State " + this.stateIndex.toString()
        } else {
            print("carouselItemScript not found on Prefab")
        }
    }

    private collisionActive(eventArgs: CollisionStayEventArgs) {

    }

    private collisionStop(eventArgs: CollisionExitEventArgs) {

    }

    public tweenCarouselRotation(destinationRotation, t): void {

        //check if a tweein in the process, if yes, stop it and launch another one
        if (this.currentTweenRot) {
            this.currentTweenRot.stop();
        }
        
        this.currentTweenRot = LSTween.rotateToLocal(
            this.root.getTransform(),
            //startRotation,
            destinationRotation,
            t
        )
        .easing(Easing.Cubic.Out) //InOut
        .delay(0) //(100) // There is a bug in TweenJS where the yoyo value will jump if no delay is set.
        .yoyo(false)
        .repeat(0) //(Infinity)
        .start();
    }
    
    public tweenCarouselScale(finalScale, t): void
    {
        //check if a tweein in the process, if yes, stop it and launch another one
        if (this.currentTweenScale) {
            this.currentTweenScale.stop();
        }

        this.currentTweenScale = LSTween.scaleToLocal(
            this.root.getTransform(),
            finalScale,
            t
        )
        .easing(Easing.Cubic.Out) //InOut
        .delay(0) //(100) // There is a bug in TweenJS where the yoyo value will jump if no delay is set.
        .yoyo(false)
        .repeat(0) //(Infinity)
        .start();
    }


    private carouselRotation(): void {

        let gotAngle = this.handControllerScript.rotationAngle
        let handDeltaSteps = Math.round(gotAngle / this.stepAngle )
        let targetStepIndex = this.startSessionStepIndex + handDeltaSteps

        if (targetStepIndex !== this.lastNumOfSteps) {

            let finalAngleRad = -targetStepIndex * this.stepAngle
            let targetQuat = quat.fromEulerAngles(0, 0, finalAngleRad);
            this.tweenCarouselRotation(targetQuat, this.animTime);
            this.lastNumOfSteps = targetStepIndex
            // this.sound.play(1)
        }
        this.currentRotation = this.root.getTransform().getLocalRotation()
    }

    private carouselStateManager(stateNum) {

        if (stateNum === 0) {
            print("pale carousel")
            if(this.flag_carouselWasRotated || this.flag_carouselWasHover) {
                this.tweenCarouselScale(this.carouselDefaultScale, this.animTime)
                if (this.carouselItemScript) {
                    this.carouselItemScript.changeIconColorToIdle()
                }
                
            }
        

            this.flag_carouselWasDefault = true
            this.flag_carouselWasHover = false
            this.flag_carouselWasRotated = false
        } 
        else if (stateNum === 1) {
            print("light carousel")
            if(this.flag_carouselWasDefault) {
                if (this.carouselItemScript) {
                    this.carouselItemScript.changeIconColorToHover()
                }
            }
            if(this.flag_carouselWasRotated) {
                this.tweenCarouselScale(this.carouselDefaultScale, this.animTime)

            }
            

            this.flag_carouselWasDefault = false
            this.flag_carouselWasHover = true
            this.flag_carouselWasRotated = false
        }
        else {
            print("active carousel")
            if(!this.flag_carouselWasRotated) {
                this.tweenCarouselScale(this.carouselActiveScale, this.animTime)
                this.startSessionStepIndex = this.lastNumOfSteps;
            }
            this.carouselRotation()

            this.flag_carouselWasDefault = false
            this.flag_carouselWasHover = false
            this.flag_carouselWasRotated = true
        }
    }


    /* private carouselRotation(): void {

        let gotAngle = this.handControllerScript.rotationAngle
        let currentNumOfSteps = Math.round(gotAngle / this.stepAngle )

        if (currentNumOfSteps !== this.lastNumOfSteps && !this.isAnimating) {

            let direction = currentNumOfSteps > this.lastNumOfSteps ? 1 : -1
            if (direction > 0) {
                let newRotation = this.currentRotation.multiply(this.deltaRotation)
                this.tweenCarouselRotation(newRotation, this.animTime * 1.0)
            } else {
                let newRotation = this.currentRotation.multiply(this.deltaRotation.invert())
                this.tweenCarouselRotation(newRotation, this.animTime * 1.0)
            }
            this.lastNumOfSteps = currentNumOfSteps
        }
        this.currentRotation = this.root.getTransform().getLocalRotation()
    } */

    
}


