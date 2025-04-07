import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FormsList = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/active-forms');
                setForms(response.data); // Set the forms with title and isActive status
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchForms();
    }, []);

    const toggleActiveState = async (formTitle, currentState) => {
        const newActiveState = !currentState;

        try {
            await axios.post('http://localhost:5000/api/update-form-status', {
                formTitle,
                isActive: newActiveState ? 1 : 0,
            });
            // Update the local state to reflect the change
            setForms((prevForms) =>
                prevForms.map((form) =>
                    form.title === formTitle ? { ...form, isActive: newActiveState } : form
                )
            );
        } catch (err) {
            console.error('Error updating form status:', err);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Active Forms</h1>
            <ul>
                {forms.map((form, index) => (
                    <li key={index}>
                        {form.title} - {form.isActive ? 'Active' : 'Inactive'}
                        <button onClick={() => toggleActiveState(form.title, form.isActive)}>
                            {form.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FormsList;