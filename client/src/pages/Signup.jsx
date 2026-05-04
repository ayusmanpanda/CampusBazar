import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, verifyOtp } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    year: 1
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const submitSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form);
      toast.success('OTP sent — check your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(form.email, otp);
      toast.success('Verified! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create your account</h1>
      {step === 1 ? (
        <form onSubmit={submitSignup} className="card space-y-3">
          <input
            className="input"
            placeholder="Full name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="input"
            type="email"
            placeholder="College email (e.g. you@college.edu.in)"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="input"
            type="password"
            placeholder="Password (min 6 chars)"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <select
              className="input"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Sending OTP…' : 'Sign up'}
          </button>
          <div className="text-sm text-slate-500 text-center">
            Already registered? <Link to="/login" className="text-brand-600 hover:underline">Login</Link>
          </div>
        </form>
      ) : (
        <form onSubmit={submitOtp} className="card space-y-3">
          <p className="text-sm text-slate-600">
            We sent a 6-digit code to <strong>{form.email}</strong>. Enter it below to verify.
          </p>
          <input
            className="input text-center text-2xl tracking-[8px]"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <button className="btn-primary w-full" disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying…' : 'Verify & finish'}
          </button>
          <button type="button" onClick={() => setStep(1)} className="btn-secondary w-full">
            Back
          </button>
        </form>
      )}
    </div>
  );
}
