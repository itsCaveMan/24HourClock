// App.js
import React from 'react';
import Clock from './Clock';

const App = () => (
  <div className="h-screen w-screen flex justify-center items-center">

      <div className='flex flex-col h-full w-full items-center justify-around'>

          <h1 className='text-[5rem] text-center'>
              24 Hour Clock
          </h1>

          <Clock />

      </div>


  </div>
);

export default App;
