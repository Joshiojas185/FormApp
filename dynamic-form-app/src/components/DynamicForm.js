
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './DynamicForm.css';

const DynamicForm = () => {
    const { tableName } = useParams();
    const [formFields, setFormFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [formTitle, setFormTitle] = useState('Dynamic Form');
    const [formDescription, setFormDescription] = useState(''); // New state for description
    const [formPostScript, setFormPostScript] = useState(''); // New state for postscript
    const [errorMessage, setErrorMessage] = useState('');
    const [formSubmitted, setFormSubmitted] = useState(false); // State to control form visibility

    useEffect(() => {
        const fetchFormFields = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/get-json-data/${tableName}`);
                const jsonData = response.data.json_data;

                if (jsonData) {
                    setFormTitle(jsonData.title);
                    setFormDescription(jsonData.description); // Set description
                    setFormPostScript(jsonData.postscript); // Set postscript

                    if (jsonData.questions) {
                        setFormFields(jsonData.questions);
                        const initialFormData = jsonData.questions.reduce((acc, field) => {
                            acc[field.text] = '';
                            return acc;
                        }, {});
                        setFormData(initialFormData);
                    }
                }
            } catch (error) {
                if (error.response && error.response.status === 403) {
                    setErrorMessage(error.response.data.error);
                } else {
                    console.error('Error fetching form fields:', error);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchFormFields();
    }, [tableName]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCheckboxChange = (name, value) => {
        const currentValues = formData[name] ? formData[name].split(',') : [];
        if (currentValues.includes(value)) {
            currentValues.splice(currentValues.indexOf(value), 1);
        } else {
            currentValues.push(value);
        }
        setFormData({ ...formData, [name]: currentValues.join(',') });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const missingFields = formFields
            .filter(field => field.required)
            .filter(field => !formData[field.text] || formData[field.text].trim() === '');

        if (missingFields.length > 0) {
            alert(`Please fill all required fields: ${missingFields.map(f => f.text).join(', ')}`);
            return;
        }

        try {
            await axios.post(`http://localhost:5000/api/submit/${tableName}`, formData);
            setFormSubmitted(true); // Set formSubmitted to true to hide the form
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Failed to submit the form.');
        }
    };

    if (loading) return <div className="loader">Loading form...</div>;

    return (
        <div className="frosted-container">
            {errorMessage ? (
                <div className="error-message">{errorMessage}</div>
            ) : formSubmitted ? (
                <div className="postscript-message">
                    <h2>Thank You!</h2>
                    <p>{formPostScript}</p> {/* Display postscript message */}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="form-card">
                    <h2 className="form-title">{formTitle}</h2>
                    <p>{formDescription}</p> {/* Display description */}
                    {formFields.map((q, index) => (
                        <div key={index} className="form-group">
                            <label className="form-label">
                                {q.text} {q.required && <span className="required">*</span>}
                            </label>
                            {(() => {
                                switch (q.type.toLowerCase()) {
                                    case 'string':
                                        return (
                                            <input
                                                type="text"
                                                name={q.text}
                                                value={formData[q.text] || ''}
                                                onChange={handleChange}
                                                required={q.required}
                                                className="form-input"
                                            />
                                        );
                                    case 'integer':
                                        return (
                                            <input
                                                type="number"
                                                name={q.text}
                                                value={formData[q.text] || ''}
                                                onChange={handleChange}
                                                required={q.required}
                                                className="form-input"
                                            />
                                        );
                                    case 'date':
                                        return (
                                            <input
                                                type="date"
                                                name={q.text}
                                                value={formData[q.text] || ''}
                                                onChange={handleChange}
                                                required={q.required}
                                                className="form-input"
                                            />
                                        );
                                    case 'multiple choice question':
                                        return (
                                            <select
                                                name={q.text}
                                                value={formData[q.text] || ''}
                                                onChange={handleChange}
                                                required={q.required}
                                                className="form-input"
                                            >
                                                <option value="">-- Select an option --</option>
                                                {q.options.map((opt, i) => (
                                                    <option key={i} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        );
                                    case 'multiple tick answer':
                                        return (
                                            <div className="checkbox-group">
                                                {q.options.map((opt, i) => (
                                                    <label key={i} className="checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            value={opt}
                                                            checked={(formData[q.text]?.split(',') || []).includes(opt)}
                                                            onChange={() => handleCheckboxChange(q.text, opt)}
                                                        />
                                                        {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        );
                                    case 'meter':
                                        return (
                                            <input
                                                type="range"
                                                min="0"
                                                max="10"
                                                name={q.text}
                                                value={formData[q.text] || 5}
                                                onChange={handleChange}
                                                required={q.required}
                                                className="form-range"
                                            />
                                        );
                                    default:
                                        return (
                                            <input
                                                type="text"
                                                name={q.text}
                                                value={formData[q.text] || ''}
                                                onChange={handleChange}
                                                required={q.required}
                                                className="form-input"
                                            />
                                        );
                                }
                            })()}
                        </div>
                    ))}
                    <button type="submit" className="submit-btn">Submit</button>
                </form>
            )}
        </div>
    );
};

export default DynamicForm;