import { getGeoPosition } from "getGeoPosition";
import { HandController } from "HandController";
import { LSTween } from "LSTween.lspkg/LSTween";
import Easing from "LSTween.lspkg/TweenJS/Easing";
import { MyUIController } from "MyUIController";
import { NavigationDataComponent } from "SpectaclesNavigationKit.lspkg/NavigationDataComponent/NavigationDataComponent";


@component
export class EarthManager extends BaseScriptComponent {


    @input
    getGeoPosScript: getGeoPosition

    @input
    uiControllerScript: MyUIController

    @input
    navigationComponent: NavigationDataComponent

    @input
    earth: SceneObject

    @input
    earth360: SceneObject

    @input
    sunPivot: SceneObject

    @input
    bitmoji: SceneObject

    @input
    hours: Material

    @input
    dateText: Text

    @input
    latAndLongText: Text

    @input
    debugText3: Text

    @input
    handControllerScript: HandController

    private latitude: number = 0
    private longitude: number = 0
    private currentIndex: number = 0
    private lastIndex: number = 0
    private currentDayTimeIndex: number = 0
    private lastDayTimeIndex: number = 0
    private flag_getDataReceived: Boolean = false
    private userPosition
    private tweenTime = 1500
    private isAnimating: boolean = false;

    private carouselState: number = 0
    private handRotationAngle: number = 0
    private currentEarthRot: quat
    private lastEarthRot: quat
    private lastSunRot: quat

    private flag_carouselWasDefault: Boolean = true
    private flag_carouselWasHover: Boolean = false
    private flag_carouselWasRotated: Boolean = false


    onAwake() {

        this.isAnimating = true;

        this.uiControllerScript.addCallback((newValue) => {
            this.onDataReceived(newValue)
        })

        this.uiControllerScript.addCallbackDayTime((newValue) => {
            this.onDayTimeIndexReceived(newValue)
        })

        this.createEvent("UpdateEvent").bind(() => {
            this.carouselState = this.handControllerScript.state
            this.handRotationAngle = this.handControllerScript.rotationAngle
            this.debugText3.text = this.handRotationAngle.toFixed(2)
                                    + "\nstate " + this.carouselState

            this.earthRotByHand(this.carouselState, this.handRotationAngle)
        })

        this.userPosition = this.navigationComponent.getUserPosition();
        this.userPosition.onUserPositionUpdated.add(() => {
            if(!this.flag_getDataReceived) {

                this.latitude = this.getGeoPosScript.latitude
                this.longitude = this.getGeoPosScript.longitude

                if (this.latitude !== undefined ) {
                    this.setEarthObjects()
                }
                this.dayTime(this.currentDayTimeIndex)
                this.flag_getDataReceived = true;  
                
                this.isAnimating = false;
            }
        })
    }

    

    private earthRotByHand(stateNum, angle) {

        if (stateNum === 0) {
            if(this.flag_carouselWasRotated || this.flag_carouselWasHover) {
                // change outline color to idle
            }

            this.flag_carouselWasDefault = true
            this.flag_carouselWasHover = false
            this.flag_carouselWasRotated = false
        } 
        else if (stateNum === 1) {
            if(this.flag_carouselWasDefault) {
                // change outline color to hover
            }
            if(this.flag_carouselWasRotated) {
                // scale the outline to idle

            }
            
            this.flag_carouselWasDefault = false
            this.flag_carouselWasHover = true
            this.flag_carouselWasRotated = false
        }
        else {
            print("active carousel")
            if(!this.flag_carouselWasRotated) {
                this.lastEarthRot = this.earth.getTransform().getLocalRotation()
                this.lastSunRot = this.sunPivot.getTransform().getLocalRotation()
            }
            let earthRot = this.earth.getTransform().getLocalRotation()
            let sunRot = this.sunPivot.getTransform().getLocalRotation()
            let boxEarthRot = this.lastEarthRot.multiply(quat.fromEulerAngles(0, -angle, 0))
            let boxSunRot = this.lastSunRot.multiply(quat.fromEulerAngles(0, angle, 0))
            let lerpEarthRot = quat.slerp(earthRot, boxEarthRot, 0.1);
            let lerpSunRot = quat.slerp(sunRot, boxSunRot, 0.1);
            
            this.earth.getTransform().setLocalRotation(lerpEarthRot)
            this.sunPivot.getTransform().setLocalRotation(lerpSunRot)

            this.flag_carouselWasDefault = false
            this.flag_carouselWasHover = false
            this.flag_carouselWasRotated = true
        }
    }

    private setEarthObjects() {
        let bitmojiAgnleLat = this.latitude * Math.PI / 180 
        let bitmojiAngleLong = this.longitude * Math.PI / 180 
        let bitmojiQuat = quat.fromEulerAngles(bitmojiAgnleLat, bitmojiAngleLong, 0)
        this.bitmoji.getTransform().setLocalRotation(bitmojiQuat)

        this.hours.mainPass.latitude = Math.round(this.latitude)

        this.latAndLongText.text = "Lat: " + this.latitude + "\nLong: " + this.longitude
    }

    private onDataReceived(index: number) {

        if(this.uiControllerScript.sunMap) {
            this.currentIndex = index
            this.tweenEarthFullRotation(this.lastDayTimeIndex, this.tweenTime)
            //this.dayTime(0) // (this.debugDayTime) // 0
            let dayItem = this.uiControllerScript.dayMap[this.currentIndex]
            this.dateText.text = this.uiControllerScript.monthInfo[dayItem.month - 1].month + " " + dayItem.day.toString() + ", " + dayItem.year.toString()
            this.lastDayTimeIndex = 0;
            this.lastIndex = this.currentIndex
        }
    }

    private onDayTimeIndexReceived(index: number) {
        this.dayTime(index) // 0
    }

    private dayTime(dayTimeIndex): void {

        this.currentDayTimeIndex = dayTimeIndex
        let earthTrf = this.earth.getTransform()

        if (dayTimeIndex === 0) {
            let angle = this.uiControllerScript.sunMap[this.currentIndex].noonAngle
            let newQuat = quat.fromEulerAngles(0, angle, 0)
            this.tweenEarthRotation(earthTrf, newQuat, this.tweenTime)
            this.lastDayTimeIndex = dayTimeIndex

        }
        if(dayTimeIndex === 1) {
            let angle = this.uiControllerScript.sunMap[this.currentIndex].dawnAngle
            let dayDuration = this.uiControllerScript.sunMap[this.currentIndex].dayDuration
            let newQuat = quat.fromEulerAngles(0, angle, 0)
            if(dayDuration >= 12 && this.lastDayTimeIndex === 2) {
                let zeroAngle = this.uiControllerScript.sunMap[this.currentIndex].noonAngle
                let zeroQuat = quat.fromEulerAngles(0, zeroAngle, 0)
                newQuat = quat.fromEulerAngles(0, angle, 0)
                this.tweenEarthDayRotation_Half1(earthTrf, zeroQuat, newQuat, this.tweenTime)
            } else {
                this.tweenEarthRotation( earthTrf, newQuat, this.tweenTime)
            }
            
            this.lastDayTimeIndex = dayTimeIndex
        }
        if(dayTimeIndex === 2) {
            let angle = this.uiControllerScript.sunMap[this.currentIndex].sunsetAngle
            let dayDuration = this.uiControllerScript.sunMap[this.currentIndex].dayDuration
            let newQuat = quat.fromEulerAngles(0, angle, 0)
            if(dayDuration >= 12 && this.lastDayTimeIndex === 1) {
                let zeroAngle = this.uiControllerScript.sunMap[this.currentIndex].noonAngle
                let zeroQuat = quat.fromEulerAngles(0, zeroAngle, 0)
                newQuat = quat.fromEulerAngles(0, angle, 0)
                this.tweenEarthDayRotation_Half1(earthTrf, zeroQuat, newQuat, this.tweenTime)
            } else {
                this.tweenEarthRotation( earthTrf, newQuat, this.tweenTime)
            }
            this.lastDayTimeIndex = dayTimeIndex
        }
        if(dayTimeIndex === 3) {
            let angle = this.uiControllerScript.sunMap[this.currentIndex].midnightAngle
            let newQuat = quat.fromEulerAngles(0, angle, 0)
            this.tweenEarthRotation(earthTrf, newQuat, this.tweenTime)
            this.lastDayTimeIndex = dayTimeIndex
        }
    }

    private tweenEarthDayRotation_Half1(transform, quaternion1, quaternion2, t) {
        LSTween.rotateToLocal(
            transform,
            quaternion1,
            t / 2
        )
        .onComplete(() => {
            this.tweenEarthDayRotation_Half2(transform, quaternion2, t)
        })
        .easing(Easing.Quadratic.In)
        .start(); 
    }
    
    private tweenEarthDayRotation_Half2(transform, quaternion2, t) {
        LSTween.rotateToLocal(
            transform,
            quaternion2,
            t / 2
        )
        .onComplete(() => {print("TWEEN EXECUTED")})
        .easing(Easing.Quadratic.Out)
        .start(); 
    }

    private tweenEarthRotation(transform, quaternion, t) {
        LSTween.rotateToLocal(
            transform,
            quaternion,
            t
        )
        .easing(Easing.Quadratic.InOut)
        .start(); 
    }

    private tweenEarthFullRotation(lastDayTimeIndex, t) {

        if(this.isAnimating) {
            return;
        }
        this.isAnimating = true;

        let currentAngle = this.uiControllerScript.sunMap[this.currentIndex].noonAngle
        let currentQuat = quat.fromEulerAngles(0, currentAngle, 0)
        let transform = this.earth.getTransform()
        this.tweenEarthRotation(transform, currentQuat, this.tweenTime)

        let startRot = this.earth360.getTransform().getLocalRotation()
        let transform360 = this.earth360.getTransform()

        LSTween.rawTween(t)
            .onUpdate((objAxle) => {
                let angleAxle = objAxle.t * Math.PI * 2;
                let rotationStepAxle = quat.fromEulerAngles(0, angleAxle, 0);
                let finalRotation = startRot.multiply(rotationStepAxle);
                transform360.setLocalRotation(finalRotation);
            })
            .onComplete(() => {
                this.isAnimating = false;
            })
            .easing(Easing.Quadratic.InOut)
            .start(); 
    }
}