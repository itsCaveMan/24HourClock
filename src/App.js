// App.js
import React, { useState, useRef, useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'clockSegmentColors';

const Clock = () => {
  const size = 300;
  const center = size / 2;
  const radius = center - 10;

  // Load saved segments on mount.
  const [segmentColors, setSegmentColors] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [activeColor, setActiveColor] = useState('blue');
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef(null);
  const draggedRef = useRef(false);

  // Persist changes to localStorage.
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(segmentColors));
  }, [segmentColors]);

  const getSegmentIndex = (clientX, clientY, rect) => {
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const dx = x - center;
    const dy = y - center;
    if (Math.hypot(dx, dy) > radius) return null;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;
    return Math.floor(angle / 15);
  };

  const handleMouseDown = (e) => {
    if (!svgRef.current) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    draggedRef.current = false;
    setDragging(true);
    const rect = svgRef.current.getBoundingClientRect();
    const seg = getSegmentIndex(e.clientX, e.clientY, rect);
    if (seg !== null) {
      setSegmentColors(prev => ({ ...prev, [seg]: activeColor }));
    }
  };

  const handleMouseMove = (e) => {
    if (!dragging || !svgRef.current) return;
    const { x, y } = dragStartRef.current;
    if (!draggedRef.current && Math.hypot(e.clientX - x, e.clientY - y) > 5) {
      draggedRef.current = true;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const seg = getSegmentIndex(e.clientX, e.clientY, rect);
    if (seg !== null) {
      setSegmentColors(prev => {
        if (prev[seg] === activeColor) return prev;
        return { ...prev, [seg]: activeColor };
      });
    }
  };

  const handleMouseUp = (e) => {
    if (!svgRef.current) return;
    // If it was a simple click, toggle the segment.
    if (!draggedRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const seg = getSegmentIndex(e.clientX, e.clientY, rect);
      if (seg !== null) {
        setSegmentColors(prev => {
          const next = { ...prev };
          if (next[seg] === activeColor) delete next[seg];
          else next[seg] = activeColor;
          return next;
        });
      }
    }
    setDragging(false);
  };

  const polarToCartesian = (angleDeg, r = radius) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) };
  };

  const renderSegment = (i) => {
    const startAngle = i * 15 - 90;
    const endAngle = (i + 1) * 15 - 90;
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const d = `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y} Z`;
    return <path key={i} d={d} fill={segmentColors[i] || 'transparent'} />;
  };

  const segments = [];
  for (let i = 0; i < 24; i++) {
    segments.push(renderSegment(i));
  }

  const numbers = [];
  for (let i = 0; i < 24; i++) {
    const { x, y } = polarToCartesian(i * 15 - 90, radius - 20);
    numbers.push(
      <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="12">
        {i}
      </text>
    );
  }

  const colors = [
    { color: 'blue', label: 'Sleep' },
    { color: 'purple', label: 'Work' },
    { color: 'green', label: 'Rest' },
    { color: 'yellow', label: 'Hobby' },
  ];

  // Count segments for a given color.
  const countColor = (color) =>
    Object.values(segmentColors).filter(c => c === color).length;

  // Clear segments and local storage.
  const clearClock = () => {
    setSegmentColors({});
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginBottom: '1rem' }}>
        {colors.map(({ color, label }) => (
          <button
            key={color}
            onClick={() => setActiveColor(color)}
            style={{
              backgroundColor: color,
              color: 'white',
              margin: '0 0.5rem',
              padding: '0.5rem 1rem',
              border: activeColor === color ? '2px solid black' : 'none',
              cursor: 'pointer'
            }}
          >
            {label} | {countColor(color)}
          </button>
        ))}
        <button
          onClick={clearClock}
          style={{
            backgroundColor: 'gray',
            color: 'white',
            margin: '0 0.5rem',
            padding: '0.5rem 1rem',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ userSelect: 'none', cursor: dragging ? 'grabbing' : 'pointer' }}
      >
        <circle cx={center} cy={center} r={radius} fill="white" stroke="black" strokeWidth="3" />
        {segments}
        {numbers}
      </svg>
    </div>
  );
};

const App = () => (
  <div
    style={{
      display: 'flex',
      height: '100vh',
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
    <Clock />
  </div>
);

export default App;
