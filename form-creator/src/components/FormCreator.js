import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FormCreator = () => {
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState(''); // New state for description
    const [formPostScript, setFormPostScript] = useState(''); // New state for postscript
    const [questions, setQuestions] = useState([]);
    const [forms, setForms] = useState([]);

    const addQuestion = () => {
        setQuestions([...questions, { question: '', type: 'string', options: [], required: false }]);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionsChange = (index, value) => {
        const newQuestions = [...questions];
        newQuestions[index].options = value.split(',').map(opt => opt.trim());
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = {
            title: formTitle,
            description: formDescription, // Include description
            postscript: formPostScript, // Include postscript
            questions: questions.map(q => ({
                text: q.question,
                type: q.type,
                options: q.options.length > 0 ? q.options : undefined,
                required: q.required
            }))
        };

        try {
            const response = await axios.post('http://localhost:5000/create-form', data);
            alert(response.data);
            loadForms();
        } catch (error) {
            console.error('Error creating form:', error);
        }
    };

    const loadForms = async () => {
        try {
            const response = await axios.get('http://localhost:5000/get-forms');
            setForms(response.data);
        } catch (error) {
            console.error('Error fetching forms:', error);
        }
    };

    useEffect(() => {
        loadForms();
    }, []);

    return (
        <div>
            <h1>Create Form</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Form Title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                />
                <textarea
                    placeholder="Description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                />
                <textarea
                    placeholder="PostScript"
                    value={formPostScript}
                    onChange={(e) => setFormPostScript(e.target.value)}
                />
                <div>
                    {questions.map((q, index) => (
                        <div key={index} style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder="Question"
                                value={q.question}
                                onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                                required
                            />
                            <select
                                value={q.type}
                                onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                            >
                                <option value="string">String</option>
                                <option value="integer">Integer</option>
                                <option value="date">Date</option>
                                <option value="time">Time</option>
                                <option value="meter">Meter</option>
                                <option value="multiple choice question">Multiple Choice</option>
                                <option value="multiple tick answer">Multiple Tick Answer</option>
                            </select>
                            {['multiple choice question', 'multiple tick answer'].includes(q.type) && (
                                <input
                                    type="text"
                                    placeholder="Options (comma separated)"
                                    onChange={(e) => handleOptionsChange(index, e.target.value)}
                                />
                            )}
                            <label style={{ display: 'block', marginTop: '5px' }}>
                                <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => handleQuestionChange(index, 'required', e.target.checked)}
                                />
                                Required
                            </label>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addQuestion}>Add Question</button>
                <button type="submit">Create Form</button>
            </form>

            <h1>Existing Forms</h1>
            <select>
                {forms.map((form, index) => (
                    <option key={index} value={form}>{form.replace(/_/g, ' ')}</option>
                ))}
            </select>
        </div>
    );
};

export default FormCreator;