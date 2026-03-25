import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/axios';
import { getUsers } from '../api/user';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getUsers()
      .then(res => {
        setUsers(res || []);   // 此时 res 已经是数组
      })
      .catch(err => console.error('获取用户列表失败', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', result.token);   // result 就是 { token: "..." }
      navigate('/');
    } catch (err) {
      setError('用户名不存在或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8 bg-white shadow-xl rounded-lg overflow-hidden">
        {/* 左侧登录表单 */}
        <div className="flex-1 p-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center">登录账户</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            或者{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              注册新账户
            </Link>
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </div>
          </form>
        </div>

        {/* 右侧用户列表 */}
        <div className="bg-indigo-50 p-8 flex-1 border-l border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">已有用户</h3>
          {users.length === 0 ? (
            <p className="text-gray-500">暂无其他用户</p>
          ) : (
            <ul className="space-y-2">
              {users.map((user, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                  {user}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;