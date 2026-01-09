import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, password }
      );

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success('Login successful 🎉');

      navigate('/dashboard');
    } catch (error) {
      toast.error('Invalid email or password');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center p-2">
      <div className="w-full h-full bg-white rounded-[28px] shadow-2xl overflow-hidden flex">

        {/* LEFT PANEL */}
        <div className="w-[42%] px-16 py-14 flex flex-col justify-between bg-gradient-to-b from-blue-50 via-blue-100 to-indigo-100">
          <div>
            {/* Brand */}
            <div className="mb-24">
              <span className="inline-flex items-center px-5 py-2 rounded-full text-sm font-medium text-gray-700 bg-blue-500/60">
                DLCSAI
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-semibold text-gray-900 mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600 mb-12">
              Sign in to access your dashboard
            </p>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-[52px] px-5 rounded-full bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-[52px] px-5 rounded-full bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[54px] mt-5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-95 transition disabled:opacity-50"
              >
                {isLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-sm text-gray-500">
            © 2026 DLCSAI Platform
          </div>
        </div>

        {/* RIGHT IMAGE PANEL */}
        <div className="relative w-[58%] bg-blue-900">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c"
            alt="Team working"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Overlay Cards */}
          <div className="absolute top-10 left-10 bg-white/50  backdrop-blur rounded-2xl px-6 py-4 shadow-lg">
            <p className="text-sm font-semibold text-white">
              Redefining Education
            </p>
          </div>

          <div className="absolute top-25 left-20 bg-white/50 backdrop-blur rounded-2xl px-6 py-4 shadow-lg">
            <p className="text-sm font-semibold text-white">
              Empowering Every Learner
            </p>
          </div>

          <div className="absolute bottom-10 right-10 bg-white/50 backdrop-blur rounded-2xl px-6 py-4 shadow-lg">
            <p className="text-sm font-semibold text-white">
              Redefining Education
            </p>
          </div>

          <div className="absolute bottom-25 right-20 bg-white/50 backdrop-blur rounded-2xl px-6 py-4 shadow-lg">
            <p className="text-sm font-semibold text-white">
              Empowering Every Learner
            </p>
          </div>


        </div>

      </div>
    </div>
  );
}

export default Login;
