
import React, { useState } from 'react';

const DynamicFormGenerator = () => {
    const [formData, setFormData] = useState([]);
    const [formTitle, setFormTitle] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const jsonData = JSON.parse(e.target.result);
                generateForm(jsonData);
            };
            reader.readAsText(file);
        }
    };

    const generateForm = (jsonData) => {
        setFormTitle(jsonData.title);
        setFormData(jsonData.questions);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const formValues = {};
        formData.forEach((question) => {
            const input = document.querySelector(`input[name="${question.text}"], select[name="${question.text}"]`);
            if (input) {
                formValues[question.text] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });
        console.log('Form Values:', formValues);
        // You can handle form submission here (e.g., send to an API)
    };

    return (
        <div>
            <h2>Upload JSON to Generate Form</h2>
            <input type="file" accept="application/json" onChange={handleFileChange} />
            <div className="form-container">
                {formTitle && <h3>{formTitle}</h3>}
                <form onSubmit={handleSubmit}>
                    {formData.map((q, index) => {
                        return (
                            <div key={index} className="question">
                                <label>{q.text}</label><br />
                                {(() => {
                                    let inputElement;
                                    switch (q.type.toLowerCase()) {
                                        case 'string':
                                            inputElement = <input type="text" name={q.text} />;
                                            break;
                                        case 'integer':
                                            inputElement = <input type="number" name={q.text} />;
                                            break;
                                        case 'date':
                                            inputElement = <input type="date" name={q.text} />;
                                            break;
                                        case 'multiple choice question':
                                            inputElement = (
                                                <select name={q.text}>
                                                    {q.options.map((option, idx) => (
                                                        <option key={idx} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                            );
                                            break;
                                        case 'multiple tick answer':
                                            return (
                                                <div>
                                                    {q.options.map((option, idx) => (
                                                        <div key={idx}>
                                                            <input type="checkbox" name={q.text} value={option} />
                                                            <label>{option}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        case 'meter':
                                            inputElement = <input type="range" name={q.text} min="1" max="10" />;
                                            break;
                                        default:
                                            inputElement = <input type="text" name={q.text} />;
                                    }
                                    return inputElement;
                                })()}
                            </div>
                        );
                    })}
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>
    );
};

export default DynamicFormGenerator;




