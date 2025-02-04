import React, {useState, useRef, useEffect} from 'react';

// Key used to store/retrieve clock segment data in/from local storage.
const LOCAL_STORAGE_KEY = 'clockSegmentColors';

// Base Tailwind CSS classes for all buttons.
// This string is reused for styling each button.
const btn = 'mx-2 px-4 py-2 text-white cursor-pointer';


/**
 * Clock Component:
 * - Renders a large 24-hour interactive clock using an SVG.
 * - Each hour is represented as a segment (or "slice") of the circle.
 * - Users can click or drag to fill segments with an active color.
 * - The selections are stored in local storage to persist between sessions.
 */
export default function Clock(){
    // Define the overall size of the SVG clock.
    const size = 700; // Increased size for a larger clock
    const center = size / 2; // Center point of the clock (x and y)
    const radius = center - 10; // Radius of the clock's circle, with a small margin

    /**
     * State: segmentColors
     * - An object mapping each segment index (0–23) to a color string.
     * - Initialized from local storage if available.
     */
    const [segmentColors, setSegmentColors] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    });

    // State to track the currently selected (active) color.
    const [activeColor, setActiveColor] = useState('blue');

    // Ref for the SVG element to get its position and dimensions.
    const svgRef = useRef(null);

    // State and refs to handle dragging behavior.
    const [dragging, setDragging] = useState(false);
    const dragStartRef = useRef(null); // Stores the initial mouse down position
    const draggedRef = useRef(false);  // Flag to indicate if the user has dragged

    // Save segmentColors to local storage every time it changes.
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(segmentColors));
    }, [segmentColors]);

    /**
     * getSegmentIndex:
     * - Calculates which clock segment (0–23) the user's pointer is over.
     * - It takes the clientX/Y mouse coordinates and the SVG's bounding rectangle.
     *
     * How it works:
     * 1. Translates the mouse position to the SVG coordinate system.
     * 2. Computes the difference (dx, dy) from the center of the clock.
     * 3. Uses the Pythagorean theorem (Math.hypot) to check if the point is within the circle.
     * 4. Calculates the angle (in degrees) from the vertical (12 o'clock) by:
     *    - Using Math.atan2(dy, dx) which returns an angle relative to the positive x-axis.
     *    - Adjusting by 90° to shift the starting point to the top.
     *    - Normalizing the angle between 0° and 360°.
     * 5. Divides the circle (360°) into 24 segments (each 15°) and returns the segment index.
     *
     * @param {number} clientX - The X coordinate from the mouse event.
     * @param {number} clientY - The Y coordinate from the mouse event.
     * @param {DOMRect} rect - The bounding rectangle of the SVG element.
     * @returns {number|null} - The segment index (0–23) or null if outside the circle.
     */
    const getSegmentIndex = (clientX, clientY, rect) => {
        // Translate the mouse position relative to the SVG's top-left corner.
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Calculate the difference from the center of the clock.
        const dx = x - center;
        const dy = y - center;

        // If the pointer is outside the circle (using the Pythagorean theorem), return null.
        if (Math.hypot(dx, dy) > radius) return null;

        // Calculate the angle (in degrees) from the x-axis.
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Adjust angle so that 0° is at the top (12 o'clock) instead of the right (3 o'clock).
        angle = (angle + 90 + 360) % 360;

        // Divide the full circle (360°) into 24 segments of 15° each.
        return Math.floor(angle / 15);
    };

    /**
     * handleMouseDown:
     * - Called when the user presses the mouse button down on the clock.
     * - Starts the dragging process.
     * - Records the starting position and colors the segment under the pointer.
     */
    const handleMouseDown = (e) => {
        if (!svgRef.current) return;

        // Record the initial position of the mouse.
        dragStartRef.current = {x: e.clientX, y: e.clientY};
        draggedRef.current = false;
        setDragging(true);

        // Get the SVG element's bounding rectangle.
        const rect = svgRef.current.getBoundingClientRect();

        // Determine which segment the user clicked.
        const seg = getSegmentIndex(e.clientX, e.clientY, rect);
        if (seg !== null) {
            setSegmentColors(prev => ({...prev, [seg]: activeColor}));
        }
    };

    /**
     * handleMouseMove:
     * - Called when the mouse moves over the clock while dragging.
     * - Updates the segment color for the segment under the pointer.
     */
    const handleMouseMove = (e) => {
        if (!dragging || !svgRef.current) return;

        // Check if the mouse has moved far enough to be considered a drag.
        const {x, y} = dragStartRef.current;
        if (!draggedRef.current && Math.hypot(e.clientX - x, e.clientY - y) > 5) {
            draggedRef.current = true;
        }

        // Get the bounding rectangle of the SVG.
        const rect = svgRef.current.getBoundingClientRect();

        // Determine the segment under the pointer.
        const seg = getSegmentIndex(e.clientX, e.clientY, rect);
        if (seg !== null) {
            setSegmentColors(prev => {
                // If the segment already has the active color, no update is needed.
                if (prev[seg] === activeColor) return prev;
                // Otherwise, update the segment's color.
                return {...prev, [seg]: activeColor};
            });
        }
    };

    /**
     * handleMouseUp:
     * - Called when the user releases the mouse button.
     * - If no dragging occurred (a simple click), it toggles the segment's color.
     * - Ends the dragging process.
     */
    const handleMouseUp = (e) => {
        if (!svgRef.current) return;

        // If the user did not drag (i.e., just clicked), toggle the segment's color.
        if (!draggedRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const seg = getSegmentIndex(e.clientX, e.clientY, rect);
            if (seg !== null) {
                setSegmentColors(prev => {
                    const next = {...prev};
                    // Toggle: if the segment already has the active color, remove it; otherwise, set it.
                    if (next[seg] === activeColor) delete next[seg];
                    else next[seg] = activeColor;
                    return next;
                });
            }
        }
        setDragging(false);
    };

    /**
     * polarToCartesian:
     * - Converts polar coordinates (angle and radius) to Cartesian coordinates (x, y).
     *
     * Explanation for non-math folks:
     * Imagine a circle with a center point. Instead of specifying a point by how far
     * it is from the center (radius) and in which direction (angle), we need to find its
     * x and y positions on a flat surface. This function does that conversion.
     *
     * @param {number} angleDeg - The angle in degrees.
     * @param {number} [r=radius] - The radius (distance from the center). Defaults to the clock's radius.
     * @returns {Object} An object with x and y properties.
     */
    const polarToCartesian = (angleDeg, r = radius) => {
        // Convert the angle from degrees to radians since Math.cos and Math.sin use radians.
        const rad = (angleDeg * Math.PI) / 180;
        // Calculate x and y coordinates relative to the center of the clock.
        return {x: center + r * Math.cos(rad), y: center + r * Math.sin(rad)};
    };

    /**
     * renderSegment:
     * - Renders one segment (or "slice") of the clock.
     *
     * How it works:
     * 1. Calculates the starting and ending angles for the segment.
     *    - Each segment spans 15° (since 360° / 24 = 15°).
     *    - Subtract 90° so that the first segment starts at the top.
     * 2. Converts these angles into x,y coordinates using polarToCartesian.
     * 3. Constructs an SVG path that:
     *    - Moves from the center to the start of the arc.
     *    - Draws an arc to the end point.
     *    - Closes the shape back to the center.
     *
     * @param {number} i - The index of the segment (0 to 23).
     * @returns {JSX.Element} A JSX path element representing the clock segment.
     */
    const renderSegment = (i) => {
        // Determine the start and end angles for the segment.
        const startAngle = i * 15 - 90;
        const endAngle = (i + 1) * 15 - 90;

        // Get the (x, y) coordinates for the start and end of the segment.
        const start = polarToCartesian(startAngle);
        const end = polarToCartesian(endAngle);

        // Build the SVG path command:
        // M = move to center, L = line to start point,
        // A = draw an arc, Z = close the path.
        const d = `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y} Z`;

        // Return the path element with the appropriate fill color.
        return <path key={i} d={d} fill={segmentColors[i] || 'transparent'}/>;
    };

    // Create an array of all 24 segments.
    const segments = [];
    for (let i = 0; i < 24; i++) {
        segments.push(renderSegment(i));
    }

    /**
     * Render the hour numbers (0–23) around the clock.
     * - Positions each number using polarToCartesian, slightly inset from the edge.
     */
    const numbers = [];
    for (let i = 0; i < 24; i++) {
        // Place the number at radius - 30 for spacing.
        const {x, y} = polarToCartesian(i * 15 - 90, radius - 30);
        numbers.push(
            <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="16" // Increased font size for readability
                className="fill-black"
            >
                {i}
            </text>
        );
    }

    // Define the color categories with labels.
    const colors = [
        {color: 'blue', label: 'Sleep'},
        {color: 'purple', label: 'Work'},
        {color: 'green', label: 'Rest'},
        {color: 'yellow', label: 'Hobby'}
    ];

    /**
     * countColor:
     * - Counts how many segments are filled with a specific color.
     * @param {string} color - The color to count (e.g., 'blue').
     * @returns {number} The count of segments with that color.
     */
    const countColor = (color) =>
        Object.values(segmentColors).filter(c => c === color).length;

    /**
     * clearClock:
     * - Resets the clock by clearing all segment colors.
     * - Also removes the corresponding data from local storage.
     */
    const clearClock = () => {
        setSegmentColors({});
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    };

    return (
        <div className="flex flex-col items-center">
            {/* Button Panel */}
            <div className="mb-4">
                {colors.map(({color, label}) => {
                    // Map the color name to Tailwind background classes.
                    const bgClass =
                        color === 'blue'
                            ? 'bg-blue-500'
                            : color === 'purple'
                                ? 'bg-purple-500'
                                : color === 'green'
                                    ? 'bg-green-500'
                                    : 'bg-yellow-500';

                    return (
                        <button
                            key={color}
                            onClick={() => setActiveColor(color)}
                            className={`${btn} ${bgClass} ${activeColor === color ? 'border-2 border-black' : ''}`}
                        >
                            {label} | {countColor(color)}
                        </button>
                    );
                })}
                {/* Clear Button */}
                <button onClick={clearClock} className={`${btn} bg-gray-500`}>
                    Clear
                </button>
            </div>

            {/* SVG Clock */}
            <svg
                ref={svgRef}
                width={size}
                height={size}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className={`select-none ${dragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
            >
                {/* Main clock circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="white"
                    stroke="black"
                    strokeWidth="3"
                />
                {segments}
                {numbers}
            </svg>
        </div>
    );
};