import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import FormCreator from './components/FormCreator'; // Import the FormCreator component
import FormsList from './components/FormsList';
import TableList from './components/TableList';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/create" />} /> {/* Redirect from root to /create-form */}
                <Route path="/panel" element={<FormsList />} />
                <Route path="/response" element={<TableList />} />
                <Route path="/create" element={<FormCreator />} /> {/* Redirect from root to /create-form */}
            </Routes>
        </Router>
    );
}

export default App;
