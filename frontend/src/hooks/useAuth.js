import { createContext, useContext, useState, useEffect } from 'react';
import { useMatomo } from '@datapunt/matomo-tracker-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { pushInstruction } = useMatomo(); // Lấy hàm pushInstruction để set User ID

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Nếu load lại trang mà đã login, set lại User ID cho Matomo
      if (parsedUser.email) {
        pushInstruction('setUserId', parsedUser.email);
      }
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async ({ email, password }) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    // --- MATOMO TRACKING ---
    // Gắn User ID (dùng email hoặc ID) để theo dõi hành trình cụ thể
    pushInstruction('setUserId', data.user.email);
    // -----------------------

    return data.user;
  };

  const register = async ({ username, email, password, confirmPassword }) => {
    if (password !== confirmPassword) throw new Error('Mật khẩu không khớp');
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Register failed');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    
    // --- MATOMO TRACKING ---
    pushInstruction('setUserId', data.user.email);
    // -----------------------

    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);

    // --- MATOMO TRACKING ---
    // Xóa User ID khi logout để phiên tiếp theo tính là khách (Guest)
    pushInstruction('resetUserId');
    // Track một pageview mới để reset trạng thái phiên
    pushInstruction('trackPageView');
    // -----------------------
  };

  const updateProfile = async (profileData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');

    const updatedUser = { ...user, ...data.user };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);