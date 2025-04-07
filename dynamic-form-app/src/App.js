
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DynamicForm from './components/DynamicForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/form/:tableName" element={<DynamicForm />} />
      </Routes>
    </Router>
  );
}

export default App;
