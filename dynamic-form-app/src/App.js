
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DynamicForm from './components/DynamicForm';
import DynamicFormGenerator from './components/DynamicFormGenerator';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/form/:tableName" element={<DynamicForm />} />
        <Route path="/forms" element={<DynamicFormGenerator />} />
      </Routes>
    </Router>
  );
}

export default App;
