// App.js
import React from 'react';
import Clock from './Clock';

const App = () => (
    <div
        style={{
            display: 'flex',
            height: '100vh',
            justifyContent: 'center',
            alignItems: 'center'
        }}
    >
        <Clock/>
    </div>
);

export default App;
