import { Frame } from "SpectaclesUIKit.lspkg/Scripts/Components/Frame/Frame";

@component
export class InvisibleFrame extends Frame 
{
    onAwake() {

        // call base initialization, if it needs 
        super.onAwake();

        // overwrite the function, so it does nothing
        this.showVisual = () => {
            this.roundedRectangle.renderMeshVisual.enabled = false // turn off the rectangle
        };

        // overwrite the function, so it does nothing
        this.hideVisual = () => {
            this.roundedRectangle.renderMeshVisual.enabled = false
        };
    }
}
