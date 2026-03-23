# AR Earth-Sun Orrery

The AR Earth-Sun Orrery is an educational tool designed to bring the complex movements of our solar system into the immediate environment. By using Augmented Reality, this model bridges the gap between astronomical concepts and physical reality.

## Problem
Transitioning from a geocentric (Earth-centered) to a heliocentric (Sun-centered) model was one of the greatest shifts in astronomy and human history. Traditional teaching methods often rely on static 2D diagrams, requiring students to overextend their imagination to understand seasons and day duration changes.

## Solution
This project focuses on the relationship between the Sun and the Earth from different perspectives. By combining and synchronizing the heliocentric model with geocentric sun movement projection, the model demonstrates real-time dependencies between both systems. This approach facilitates a deeper and easier understanding of celestial mechanics.

## Key Features
* **Model Synchronization**: Real-time alignment between heliocentric and geocentric models.
* **Dynamic Astronomical Simulation**: Uses precise formulas to adjust Earth’s tilt, Sun declination, and orbit based on specific latitude, simulating seasonal transitions and day length.
* **Integrated UI**: Interface is built directly into the model. Day rotation is controlled via hand rotation (using a custom hand-hint system originally developed for AR Carousel).
* **Interactive Navigation**: Year rotation is accessible by tapping months or solstice/equinox points, with an additional controller for accurate Earth positioning.
* **Geolocation Mapping**: Avatar position on Earth scales according to latitude and longitude. 
* **Visual Data Visualization**: 
    * Latitude marked by dashed lines (one dash = one hour) for visual day duration estimation.
    * Sun path marked with hours and data on sun height (angle between horizon and noon point).
* **Advanced Visuals**: 
    * Smooth transition animations inspired by vintage mechanical orreries.
    * Custom compass displaying a 135-degree sector to compensate for FOV restrictions.

## Technical Implementation (Shaders)
The Sun surface shader is designed based on real solar imaging (NSF/AURA/NSO). It mimics plasma bubbles rising in bright convective zones and cooling in dark intergranular lanes. The cells were intentionally designed larger and softer to prevent pixel flickering in AR. The Sun crown shader utilizes a plane with a LookAt component directed at the camera for consistent visual fidelity.

## Tools & Technologies
* **Software**: Lens Studio, Visual Studio Code, Adobe Illustrator, Adobe Photoshop, Blender.
* **Frameworks**: Spectacles Navigation Kit, Spectacles UI Kit, Bitmoji Plugin.
* **AI & Logic**: Gemini, Typescript.
* **Core Tech**: Spectacles, World Tracking, Shader programming (GLSL).

## Skills Applied
* UI/UX Design for Augmented Reality
* Advanced Shader Programming
* Mathematical Modeling & Astronomy Formulas
* Typescript Development
