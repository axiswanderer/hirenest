import { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const CreateJob = () => {
    const [form, setForm] = useState({ title: '', company: '', description: '', location: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/jobs/', form);
            navigate('/');
        } catch (err) {
            alert("Failed. Are you logged in as a Recruiter?");
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">Post a New Job</h2>
                <input className="w-full border p-2 mb-3 rounded" placeholder="Job Title" onChange={e => setForm({...form, title: e.target.value})} />
                <input className="w-full border p-2 mb-3 rounded" placeholder="Company" onChange={e => setForm({...form, company: e.target.value})} />
                <input className="w-full border p-2 mb-3 rounded" placeholder="Location" onChange={e => setForm({...form, location: e.target.value})} />
                <textarea className="w-full border p-2 mb-3 rounded" placeholder="Job Description" rows="4" onChange={e => setForm({...form, description: e.target.value})} />
                <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Post Job</button>
            </form>
        </div>
    );
};

export default CreateJob;